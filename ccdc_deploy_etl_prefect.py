import json
import os
import subprocess
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple

from prefect import flow
import prefect.variables as Variable


Operation = Literal["node dropTable.js", "node createTable.js", "node index.js"]
LowerEnvironment = Literal["dev", "qa"]
UpperEnvironment = Literal["stage", "production"]
Environment = Literal["dev", "qa", "stage", "production"]
COMMAND_ORDER: Tuple[Operation, ...] = (
    "node dropTable.js",
    "node createTable.js",
    "node index.js",
)
ETL_REPOSITORY = "https://github.com/CBIIT/CCDC-ETL.git"
SITE_ANNOUNCEMENT_BASE_URL = "https://raw.githubusercontent.com/CBIIT/CCDC_Static_Contents"
SITE_ANNOUNCEMENT_FILE = "site_announcement_log.md"
DEFAULT_S3_BUCKET_ENV_VAR = "CCDC_ETL_S3_BUCKET"
CONNECTION_SECRET_PREFECT_VARIABLES = {
    "dev": "ccdc_etl_secret_name_dev",
    "qa": "ccdc_etl_secret_name_qa",
    "stage": "ccdc_etl_secret_name_stage",
    "production": "ccdc_etl_secret_name_prod",
}
CONNECTION_SECRET_ENV_MAPPING = {
    "RDB_HOST": "host",
    "RDB_USER": "username",
    "RDB_PASSWORD": "password",
    "RDB_NAME": "dbname",
    "ES_HOST": "opensearch_host",
}
DEFAULT_RDB_NAME = "ccdc"
TIER_ENVIRONMENTS = {
    "lower": {"dev", "qa"},
    "upper": {"stage", "production"},
}


def _run(command: List[str], cwd: Path, env: Optional[Dict[str, str]] = None) -> None:
    print(f"Running command: {' '.join(command)}", flush=True)
    process = subprocess.Popen(
        command,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    if process.stdout:
        for line in process.stdout:
            print(line, end="", flush=True)

    returncode = process.wait()
    if returncode != 0:
        raise RuntimeError(
            f"Command '{' '.join(command)}' failed with exit code {returncode}."
        )


def _site_announcement_url(environment: str) -> str:
    return f"{SITE_ANNOUNCEMENT_BASE_URL}/{environment}/{SITE_ANNOUNCEMENT_FILE}"


def _validate_environment_for_tier(environment: str) -> None:
    tier = os.environ.get("CCDC_ETL_TIER")
    if not tier:
        return

    allowed_environments = TIER_ENVIRONMENTS.get(tier)
    if allowed_environments is None:
        raise ValueError(f"CCDC_ETL_TIER must be one of: {', '.join(sorted(TIER_ENVIRONMENTS))}.")
    if environment not in allowed_environments:
        raise ValueError(
            f"The {tier} tier only supports these environments: "
            f"{', '.join(sorted(allowed_environments))}."
        )


def _validate_etl_branch(repo_dir: Path, etl_branch: str) -> None:
    if not etl_branch:
        raise ValueError("etl_branch is required.")

    result = subprocess.run(
        ["git", "ls-remote", "--exit-code", "--heads", ETL_REPOSITORY, f"refs/heads/{etl_branch}"],
        cwd=repo_dir,
        check=False,
    )
    if result.returncode != 0:
        raise ValueError(f"etl_branch '{etl_branch}' was not found in {ETL_REPOSITORY}.")


def _get_prefect_variable(variable_name: str) -> str:
    value = Variable.get(variable_name)
    if not value:
        raise ValueError(f"Prefect variable '{variable_name}' must contain an AWS secret name.")
    return value


def _load_secret(secret_name: str, repo_dir: Path) -> Dict[str, str]:
    result = subprocess.run(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            secret_name,
            "--query",
            "SecretString",
            "--output",
            "text",
        ],
        cwd=repo_dir,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise ValueError("Failed to load the CCDC ETL connection secret from AWS Secrets Manager.")
    return json.loads(result.stdout)


def _load_connection_env(environment: str, repo_dir: Path) -> Dict[str, str]:
    secret_variable_name = CONNECTION_SECRET_PREFECT_VARIABLES[environment]
    secret_name = _get_prefect_variable(secret_variable_name)
    secret = _load_secret(secret_name, repo_dir)

    optional_secret_keys = {CONNECTION_SECRET_ENV_MAPPING["RDB_NAME"]}
    missing_keys = [
        secret_key
        for secret_key in CONNECTION_SECRET_ENV_MAPPING.values()
        if secret_key not in optional_secret_keys and not secret.get(secret_key)
    ]
    if missing_keys:
        raise ValueError(f"The CCDC ETL connection secret is missing: {', '.join(missing_keys)}.")

    connection_env = {}
    for env_key, secret_key in CONNECTION_SECRET_ENV_MAPPING.items():
        connection_env[env_key] = str(secret.get(secret_key) or DEFAULT_RDB_NAME)
    return connection_env


def _sync_s3_folder_to_digests(repo_dir: Path, s3_folder: str) -> Path:
    if not s3_folder:
        raise ValueError("s3_folder is required and must be a subfolder in the configured S3 bucket.")
    if s3_folder.startswith("s3://"):
        raise ValueError("s3_folder must be a subfolder name, not a full S3 URI.")

    s3_bucket_env_var = os.environ.get("CCDC_ETL_S3_BUCKET_ENV_VAR", DEFAULT_S3_BUCKET_ENV_VAR)
    s3_bucket = os.environ.get(s3_bucket_env_var)
    if not s3_bucket:
        raise ValueError(f"{s3_bucket_env_var} must be set to the S3 bucket name.")

    digests_dir = repo_dir / "digests"
    digests_dir.mkdir(parents=True, exist_ok=True)

    s3_prefix = s3_folder.strip("/")
    if not s3_prefix:
        raise ValueError("s3_folder must include a non-empty S3 prefix.")
    s3_uri = f"s3://{s3_bucket}/{s3_prefix}/"
    _run(["aws", "s3", "sync", s3_uri, str(digests_dir)], repo_dir)
    return digests_dir


def _run_ccdc_deploy_etl(
    environment: str,
    etl_branch: str,
    s3_folder: str,
    operation: List[Operation],
) -> None:
    repo_dir = Path(__file__).resolve().parent

    _validate_environment_for_tier(environment)
    _validate_etl_branch(repo_dir, etl_branch)

    _run(["git", "fetch", "origin", f"refs/heads/{etl_branch}", "--depth", "1"], repo_dir)
    _run(["git", "checkout", "FETCH_HEAD"], repo_dir)

    _run(["npm", "ci"], repo_dir)

    if not operation:
        raise ValueError("At least one operation must be selected.")

    selected_operations = set(operation)
    invalid_operations = selected_operations - set(COMMAND_ORDER)
    if invalid_operations:
        raise ValueError(f"Unsupported operation(s): {', '.join(sorted(invalid_operations))}")

    digests_dir = _sync_s3_folder_to_digests(repo_dir, s3_folder)

    env = os.environ.copy()
    env["NODE_ENV"] = environment
    env["S3_FOLDER"] = s3_folder
    env["DIGEST_FILE_FOLDER"] = str(digests_dir)
    env["SITE_ANNOUNCEMENT_URL"] = _site_announcement_url(environment)
    env.update(_load_connection_env(environment, repo_dir))

    for command in COMMAND_ORDER:
        if command in selected_operations:
            _run(command.split(), repo_dir, env)


@flow(name="ccdc deploy etl lower", log_prints=True)
def ccdc_deploy_etl_lower(
    environment: LowerEnvironment,
    etl_branch: str,
    s3_folder: str,
    operation: List[Operation],
) -> None:
    _run_ccdc_deploy_etl(environment, etl_branch, s3_folder, operation)


@flow(name="ccdc deploy etl upper", log_prints=True)
def ccdc_deploy_etl_upper(
    environment: UpperEnvironment,
    etl_branch: str,
    s3_folder: str,
    operation: List[Operation],
) -> None:
    _run_ccdc_deploy_etl(environment, etl_branch, s3_folder, operation)


@flow(name="ccdc deploy etl", log_prints=True)
def ccdc_deploy_etl_prefect(
    environment: Environment,
    etl_branch: str,
    s3_folder: str,
    operation: List[Operation],
) -> None:
    _run_ccdc_deploy_etl(environment, etl_branch, s3_folder, operation)


if __name__ == "__main__":
    ccdc_deploy_etl_prefect.serve(name="ccdc_deploy_etl")

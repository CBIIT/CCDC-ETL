import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const environment = require("./environment.js");

describe("environment precedence", () => {
  it.each([
    ["https://deployment.example/releases.md", "https://local.example/releases.md", "https://deployment.example/releases.md"],
    ["https://deployment.example/releases.md", undefined, "https://deployment.example/releases.md"],
    [undefined, "https://local.example/releases.md", "https://local.example/releases.md"],
    ["", "https://local.example/releases.md", "https://local.example/releases.md"],
    ["   ", "https://local.example/releases.md", "https://local.example/releases.md"],
    [undefined, undefined, undefined],
  ])("prefers an injected deployment value", (deployed, local, expected) => {
    expect(environment.preferDeployedValue(deployed, local)).toBe(expected);
  });
});

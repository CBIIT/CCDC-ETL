const preferDeployedValue = (deployedValue, localValue) => {
  if (typeof deployedValue === "string" && deployedValue.trim()) {
    return deployedValue;
  }
  return localValue;
};

module.exports = {
  preferDeployedValue,
};

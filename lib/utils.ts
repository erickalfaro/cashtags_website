// lib/utils.ts
export const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): ((...args: T) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getEnvironment = (): "dev" | "prod" => {
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  const nodeEnv = process.env.NODE_ENV;
  const isLocal = nodeEnv === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost");

  console.log(
    "Environment Detection:",
    "VERCEL_ENV:", vercelEnv,
    "VERCEL_BRANCH_URL:", vercelBranchUrl,
    "NODE_ENV:", nodeEnv,
    "isLocal:", isLocal
  );

  if (vercelEnv === "production") {
    console.log("Using prod environment");
    return "prod";
  }

  if (vercelBranchUrl || isLocal || vercelEnv === "preview" || vercelEnv === "development") {
    console.log("Using dev environment (preview or local)");
    return "dev";
  }

  // Fallback: assume prod if unclear, but log a warning
  console.warn("Unclear environment, defaulting to prod");
  return "prod";
};
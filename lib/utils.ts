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
    "isLocal:", isLocal,
    "Host:", typeof window !== "undefined" ? window.location.host : "N/A"
  );

  // Explicitly treat preview as dev
  if (vercelEnv === "preview" || vercelBranchUrl || isLocal || vercelEnv === "development") {
    console.log("Detected dev environment (preview or local)");
    return "dev";
  }

  if (vercelEnv === "production") {
    console.log("Detected prod environment");
    return "prod";
  }

  // Fallback: If Vercel variables are missing in a non-local production build, assume prod but warn
  console.warn("VERCEL_ENV and VERCEL_BRANCH_URL undefined in production build, defaulting to prod");
  return "prod";
};
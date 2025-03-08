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
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL; // Set in preview deployments
  const nodeEnv = process.env.NODE_ENV;
  const isLocal = nodeEnv === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost");

  // Enhanced logging for debugging
  console.log(
    "Environment Check - ",
    "VERCEL_ENV:", vercelEnv,
    "VERCEL_BRANCH_URL:", vercelBranchUrl,
    "NODE_ENV:", nodeEnv,
    "isLocal:", isLocal
  );

  // If VERCEL_ENV is explicitly "production", use prod
  if (vercelEnv === "production") {
    console.log("Detected production environment");
    return "prod";
  }

  // If VERCEL_BRANCH_URL exists (preview deployment) or isLocal, use dev
  if (vercelBranchUrl || isLocal || vercelEnv === "preview" || vercelEnv === "development") {
    console.log("Detected dev/preview environment");
    return "dev";
  }

  // Fallback: If VERCEL_ENV is undefined but not production, assume dev (preview case)
  if (!vercelEnv && !isLocal) {
    console.warn("VERCEL_ENV undefined in non-local environment, assuming dev (preview)");
    return "dev";
  }

  // Default to prod (should rarely hit this with proper Vercel setup)
  console.log("Defaulting to prod environment");
  return "prod";
};
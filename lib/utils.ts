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
  const nodeEnv = process.env.NODE_ENV;
  const isLocal = nodeEnv === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost");

  console.log(
    "Environment Detection:",
    "VERCEL_ENV:", vercelEnv,
    "NODE_ENV:", nodeEnv,
    "isLocal:", isLocal
  );

  // Local development environment
  if (isLocal) {
    console.log("Detected dev environment (local)");
    return "dev";
  }

  // Vercel environment handling
  switch (vercelEnv) {
    case "production":
      console.log("Detected prod environment (VERCEL_ENV=production)");
      return "prod";
    case "preview":
    case "development":
      console.log("Detected dev environment (VERCEL_ENV=preview or development)");
      return "dev";
    default:
      // Fallback for undefined VERCEL_ENV (e.g., custom deployments)
      console.warn("VERCEL_ENV not set, defaulting to prod");
      return "prod";
  }
};
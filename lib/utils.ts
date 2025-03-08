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

  // Log the environment variables for debugging
  console.log("Environment Check - VERCEL_ENV:", vercelEnv, "NODE_ENV:", nodeEnv, "isLocal:", isLocal);

  // Explicitly treat 'preview' as 'dev', and only 'production' as 'prod'
  if (vercelEnv === "production") {
    return "prod";
  }
  return "dev"; // Covers preview, development, and local
};
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
  // Environment variables from process.env (server-side only)
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  const nodeEnv = process.env.NODE_ENV;

  // Hostname detection (client-side fallback or server-side heuristic)
  const hostname = typeof window !== "undefined" 
    ? window.location.hostname 
    : process.env.VERCEL_URL || "server";

  // Local detection
  const isLocal = nodeEnv === "development" || hostname === "localhost" || hostname.startsWith("localhost:");

  // Detailed logging for debugging
  console.log(
    "Environment Detection:",
    {
      VERCEL_ENV: vercelEnv,
      VERCEL_URL: vercelUrl,
      NODE_ENV: nodeEnv,
      Hostname: hostname,
      isLocal: isLocal,
      AvailableEnvKeys: Object.keys(process.env).sort().join(", "),
    }
  );

  // Step 1: Local development (localhost:3000)
  if (isLocal) {
    console.log("Detected environment: dev (local - localhost:3000)");
    return "dev";
  }

  // Step 2: Use VERCEL_ENV if available
  if (vercelEnv) {
    switch (vercelEnv) {
      case "production":
        console.log("Detected environment: prod (VERCEL_ENV=production)");
        return "prod";
      case "preview":
      case "development":
        console.log("Detected environment: dev (VERCEL_ENV=preview or development)");
        return "dev";
      default:
        console.warn(`Unexpected VERCEL_ENV value: ${vercelEnv}, proceeding with fallback`);
    }
  } else {
    console.warn("VERCEL_ENV is undefined, falling back to VERCEL_URL and hostname");
  }

  // Step 3: Use VERCEL_URL or hostname as fallback
  if (vercelUrl) {
    if (vercelUrl === "cashtags.ai") {
      console.log("Detected environment: prod (VERCEL_URL=cashtags.ai)");
      return "prod";
    }
    if (vercelUrl === "cashtags-dev.vercel.app") {
      console.log("Detected environment: dev (VERCEL_URL=cashtags-dev.vercel.app)");
      return "dev";
    }
    // For other *.vercel.app URLs (e.g., preview branches)
    if (vercelUrl.includes(".vercel.app") && !vercelUrl.includes("cashtags-dev.vercel.app")) {
      console.log(`Detected environment: dev (VERCEL_URL=${vercelUrl} - assumed preview)`);
      return "dev";
    }
  }

  // Step 4: Fallback to hostname if VERCEL_URL is unavailable
  if (hostname === "cashtags.ai") {
    console.log("Detected environment: prod (Hostname=cashtags.ai)");
    return "prod";
  }
  if (hostname === "cashtags-dev.vercel.app") {
    console.log("Detected environment: dev (Hostname=cashtags-dev.vercel.app)");
    return "dev";
  }

  // Step 5: Final fallback based on NODE_ENV
  console.warn("No reliable Vercel vars or hostname detected, falling back to NODE_ENV:", nodeEnv);
  const finalEnv = nodeEnv === "production" ? "prod" : "dev";
  console.log(`Detected environment: ${finalEnv} (NODE_ENV fallback)`);
  return finalEnv;
};
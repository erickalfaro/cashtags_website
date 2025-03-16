// lib/utils.ts
export const debounce = <T extends () => void>(
  func: T,
  wait: number
): (() => void) => {
  let timeout: NodeJS.Timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(), wait);
  };
};

// Existing getEnvironment function remains unchanged
export const getEnvironment = (): "dev" | "prod" => {
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  const nodeEnv = process.env.NODE_ENV;
  const hostname = typeof window !== "undefined" 
    ? window.location.hostname 
    : process.env.VERCEL_URL || "server";
  const isLocal = nodeEnv === "development" || hostname === "localhost" || hostname.startsWith("localhost:");

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

  if (isLocal) {
    console.log("Detected environment: dev (local - localhost:3000)");
    return "dev";
  }

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

  if (vercelUrl) {
    if (vercelUrl === "cashtags.ai") {
      console.log("Detected environment: prod (VERCEL_URL=cashtags.ai)");
      return "prod";
    }
    if (vercelUrl === "cashtags-dev.vercel.app") {
      console.log("Detected environment: dev (VERCEL_URL=cashtags-dev.vercel.app)");
      return "dev";
    }
    if (vercelUrl.includes(".vercel.app") && !vercelUrl.includes("cashtags-dev.vercel.app")) {
      console.log(`Detected environment: dev (VERCEL_URL=${vercelUrl} - assumed preview)`);
      return "dev";
    }
  }

  if (hostname === "cashtags.ai") {
    console.log("Detected environment: prod (Hostname=cashtags.ai)");
    return "prod";
  }
  if (hostname === "cashtags-dev.vercel.app") {
    console.log("Detected environment: dev (Hostname=cashtags-dev.vercel.app)");
    return "dev";
  }

  console.warn("No reliable Vercel vars or hostname detected, falling back to NODE_ENV:", nodeEnv);
  const finalEnv = nodeEnv === "production" ? "prod" : "dev";
  console.log(`Detected environment: ${finalEnv} (NODE_ENV fallback)`);
  return finalEnv;
};
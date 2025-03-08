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
  return "dev"
};

// export const getEnvironment = (): "dev" | "prod" => {
//   const vercelEnv = process.env.VERCEL_ENV;
//   const vercelBranchUrl = process.env.VERCEL_BRANCH_URL;
//   const nodeEnv = process.env.NODE_ENV;
//   const isLocal = nodeEnv === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost");
//   const hostname = typeof window !== "undefined" ? window.location.hostname : "unknown";

//   console.log(
//     "Environment Detection:",
//     "VERCEL_ENV:", vercelEnv,
//     "VERCEL_BRANCH_URL:", vercelBranchUrl,
//     "NODE_ENV:", nodeEnv,
//     "isLocal:", isLocal,
//     "Hostname:", hostname
//   );

//   // Explicitly treat preview as dev
//   if (vercelEnv === "preview" || vercelBranchUrl || isLocal || vercelEnv === "development") {
//     console.log("Detected dev environment (preview or local via Vercel vars)");
//     return "dev";
//   }

//   // Heuristic: If hostname includes "dev" or "vercel.app" but isn’t production, assume preview
//   if (hostname.includes("vercel.app") && !hostname.includes("cashtags.ai")) {
//     console.log("Detected dev environment (preview via hostname heuristic)");
//     return "dev";
//   }

//   if (vercelEnv === "production" || hostname === "cashtags.ai") {
//     console.log("Detected prod environment");
//     return "prod";
//   }

//   // Fallback: Warn and default to prod if unclear
//   console.warn("Unclear environment, defaulting to prod");
//   return "prod";
// };
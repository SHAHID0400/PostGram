const APPWRITE_HEALTH_TIMEOUT = 3000;

const checkAppwrite = async () => {
  const endpoint = process.env.VITE_APPWRITE_URL;

  if (!endpoint) return "not_configured";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), APPWRITE_HEALTH_TIMEOUT);

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/health`, {
      method: "GET",
      headers: { "X-Appwrite-Project": process.env.VITE_APPWRITE_PROJECT_ID || "" },
      signal: controller.signal,
    });

    return response.ok ? "up" : "degraded";
  } catch {
    return "unreachable";
  } finally {
    clearTimeout(timeout);
  }
};

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.status(405).json({ status: "method_not_allowed" });
    return;
  }

  const database = await checkAppwrite();
  const memory = process.memoryUsage();
  const healthy = database === "up" || database === "not_configured";

  response.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
    },
    database,
    timestamp: new Date().toISOString(),
  });
}

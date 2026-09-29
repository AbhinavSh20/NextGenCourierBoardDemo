import { createHash, timingSafeEqual } from "node:crypto";

export type AgentAuth = "ok" | "unauthorized" | "unconfigured";

const digest = (s: string) => createHash("sha256").update(s).digest();

export function checkAgentToken(header: string | null, expected: string | undefined): AgentAuth {
  if (!expected) return "unconfigured";
  const match = header?.match(/^Bearer (.+)$/);
  if (!match) return "unauthorized";
  return timingSafeEqual(digest(match[1]), digest(expected)) ? "ok" : "unauthorized";
}

export function agentGuard(req: Request): Response | null {
  const result = checkAgentToken(req.headers.get("authorization"), process.env.AGENT_API_TOKEN);
  if (result === "ok") return null;
  if (result === "unconfigured") return Response.json({ error: "Agent API not configured" }, { status: 503 });
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

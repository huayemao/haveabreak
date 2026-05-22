import { spawnSync } from "node:child_process";

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? crypto.randomUUID();

export async function GET() {
  return Response.json({
    revision: revision,
    shortRevision: revision.substring(0, 7),
  });
}

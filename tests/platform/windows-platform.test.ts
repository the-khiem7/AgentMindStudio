import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WindowsApplicationPaths } from "../../src/infrastructure/platform/windows/windows-application-paths";
import { WindowsBoundedFileSystem } from "../../src/infrastructure/platform/windows/windows-bounded-file-system";
import { WindowsProcessRunner } from "../../src/infrastructure/platform/windows/windows-process-runner";

describe("Windows platform ports", () => {
  test("resolves application data without leaking Windows paths into the application contract", () => {
    const paths = new WindowsApplicationPaths({ LOCALAPPDATA: "C:\\Users\\Example\\AppData\\Local" }).resolve();
    expect(paths.dataRoot).toEndWith("AgentMindStudio");
    expect(paths.metadataDatabase).toEndWith("AgentMindStudio\\metadata.sqlite");
    expect(paths.snapshotRoot).toEndWith("AgentMindStudio\\snapshots");
  });

  test("reads Unicode paths inside a declared root and rejects lexical traversal", async () => {
    const root = join(tmpdir(), `AgentMindStudio filesystem ${randomUUID()} kiểm chứng`);
    mkdirSync(root);
    try {
      writeFileSync(join(root, "dữ liệu.txt"), "verified", "utf8");
      const fileSystem = new WindowsBoundedFileSystem();
      expect(await fileSystem.readText(root, "dữ liệu.txt")).toBe("verified");
      expect(() => fileSystem.resolveWithin(root, "..\\outside.txt")).toThrow("Path escapes");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("runs argument arrays with separate output and an allowlisted environment", async () => {
    const runner = new WindowsProcessRunner();
    process.env.AMS_SECRET_SENTINEL = "must-not-leak";
    const program = [
      "console.log(JSON.stringify({args: process.argv, allowed: process.env.AMS_ALLOWED ?? null, secret: process.env.AMS_SECRET_SENTINEL ?? null}));",
      "console.error('stderr-marker');",
      "process.exit(7);",
    ].join("");
    const result = await runner.run({
      executable: process.execPath,
      args: ["--eval", program, "value with spaces"],
      cwd: tmpdir(),
      environment: { AMS_ALLOWED: "visible" },
      timeoutMs: 5_000,
      maxOutputBytes: 16_384,
    });
    const payload = JSON.parse(result.stdout) as { args: string[]; allowed: string | null; secret: string | null };
    expect(result.exitCode).toBe(7);
    expect(result.stderr.trim()).toBe("stderr-marker");
    expect(payload.args).toContain("value with spaces");
    expect(payload.allowed).toBe("visible");
    expect(payload.secret).toBeNull();
    delete process.env.AMS_SECRET_SENTINEL;
  });

  test("terminates output that exceeds the configured bound", async () => {
    const runner = new WindowsProcessRunner();
    await expect(runner.run({
      executable: process.execPath,
      args: ["--eval", "console.log('x'.repeat(4096))"],
      cwd: tmpdir(),
      timeoutMs: 5_000,
      maxOutputBytes: 32,
    })).rejects.toThrow("output exceeded");
  });
});


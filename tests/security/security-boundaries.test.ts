import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WindowsBoundedFileSystem } from "../../src/infrastructure/platform/windows/windows-bounded-file-system";
import { WindowsProcessRunner } from "../../src/infrastructure/platform/windows/windows-process-runner";

describe("TG-006 security boundaries", () => {
  test("rejects a junction that resolves outside the declared read root", async () => {
    const parent = mkdtempSync(join(tmpdir(), "AgentMindStudio security "));
    const root = join(parent, "root");
    const outside = join(parent, "outside");
    const junction = join(root, "escape");
    mkdirSync(root);
    mkdirSync(outside);
    writeFileSync(join(outside, "outside.txt"), "must-not-read", "utf8");
    symlinkSync(outside, junction, "junction");

    try {
      const fileSystem = new WindowsBoundedFileSystem();
      await expect(fileSystem.readText(root, "escape\\outside.txt", 1_024)).rejects.toThrow(
        "Resolved path escapes",
      );
    } finally {
      unlinkSync(junction);
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("rejects a text file larger than the declared read limit", async () => {
    const root = mkdtempSync(join(tmpdir(), "AgentMindStudio bounded read "));
    writeFileSync(join(root, "oversized.txt"), "x".repeat(4_096), "utf8");
    try {
      const fileSystem = new WindowsBoundedFileSystem();
      await expect(fileSystem.readText(root, "oversized.txt", 32)).rejects.toThrow(
        "configured byte limit",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("does not inherit an undeclared secret environment value", async () => {
    const runner = new WindowsProcessRunner();
    process.env.AMS_TG006_SECRET = "must-not-leak";
    try {
      const result = await runner.run({
        executable: process.execPath,
        args: ["--eval", "console.log(process.env.AMS_TG006_SECRET ?? 'absent')"],
        cwd: tmpdir(),
        environment: { AMS_TG006_ALLOWED: "visible" },
        timeoutMs: 5_000,
        maxOutputBytes: 1_024,
      });
      expect(result.stdout.trim()).toBe("absent");
    } finally {
      delete process.env.AMS_TG006_SECRET;
    }
  });

  test("terminates a child process after its timeout", async () => {
    const runner = new WindowsProcessRunner();
    const startedAt = performance.now();
    const result = await runner.run({
      executable: process.execPath,
      args: ["--eval", "setTimeout(() => {}, 10_000)"],
      cwd: tmpdir(),
      timeoutMs: 150,
      maxOutputBytes: 1_024,
    });
    expect(result.exitCode).not.toBe(0);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });

  test("terminates a child process when the request is cancelled", async () => {
    const runner = new WindowsProcessRunner();
    const controller = new AbortController();
    const startedAt = performance.now();
    setTimeout(() => controller.abort(), 100);

    const exitCode = await runner.run({
      executable: process.execPath,
      args: ["--eval", "setTimeout(() => {}, 10_000)"],
      cwd: tmpdir(),
      timeoutMs: 5_000,
      maxOutputBytes: 1_024,
      signal: controller.signal,
    }).then((result) => result.exitCode, () => -1);

    expect(exitCode).not.toBe(0);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });

  test("kills a child whose output exceeds the configured per-stream limit", async () => {
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

import type {
  ProcessRequest,
  ProcessResult,
  ProcessRunnerPort,
} from "../../../application/ports/process-runner";

const REQUIRED_WINDOWS_ENVIRONMENT_KEYS = [
  "PATH",
  "SystemRoot",
  "WINDIR",
  "TEMP",
  "TMP",
  "ComSpec",
  "PATHEXT",
] as const;

async function readBounded(
  stream: ReadableStream<Uint8Array>,
  maxOutputBytes: number,
): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const next = await reader.read();
    if (next.done) break;
    byteLength += next.value.byteLength;
    if (byteLength > maxOutputBytes) {
      await reader.cancel();
      throw new Error("Child process output exceeded the configured byte limit");
    }
    chunks.push(next.value);
  }

  const output = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(output);
}

export class WindowsProcessRunner implements ProcessRunnerPort {
  public async run(request: ProcessRequest): Promise<ProcessResult> {
    if (request.timeoutMs <= 0 || request.maxOutputBytes <= 0) {
      throw new Error("Process timeout and output limit must be positive");
    }

    const environment: Record<string, string> = { ...request.environment };
    for (const key of REQUIRED_WINDOWS_ENVIRONMENT_KEYS) {
      const value = process.env[key];
      if (value && !(key in environment)) environment[key] = value;
    }

    const child = Bun.spawn({
      cmd: [request.executable, ...request.args],
      cwd: request.cwd,
      env: environment,
      signal: request.signal,
      timeout: request.timeoutMs,
      killSignal: "SIGKILL",
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      windowsHide: true,
    });

    try {
      const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        readBounded(child.stdout, request.maxOutputBytes),
        readBounded(child.stderr, request.maxOutputBytes),
      ]);
      return { exitCode, stdout, stderr };
    } catch (error) {
      child.kill("SIGKILL");
      await child.exited;
      throw error;
    }
  }
}


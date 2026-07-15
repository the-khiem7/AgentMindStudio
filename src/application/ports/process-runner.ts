export type ProcessRequest = Readonly<{
  executable: string;
  args: readonly string[];
  cwd: string;
  environment?: Readonly<Record<string, string>>;
  timeoutMs: number;
  maxOutputBytes: number;
  signal?: AbortSignal;
}>;

export type ProcessResult = Readonly<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

export interface ProcessRunnerPort {
  run(request: ProcessRequest): Promise<ProcessResult>;
}


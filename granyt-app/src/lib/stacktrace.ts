export interface StackFrame {
  filename: string
  function: string
  lineno: number
  module?: string
  source_context?: { lineno: number; code: string; current: boolean }[]
  locals?: Record<string, string>
}

const EXCLUDED_PATTERNS = [
  "site-packages",
  "dist-packages",
  "lib/python",
  "python3.",
  "<frozen",
  "anaconda",
  "venv/",
  ".venv/",
  "granyt_sdk",
  "node_modules", // Just in case
];

export function isUserCode(filename: string): boolean {
  if (!filename) return false;
  return !EXCLUDED_PATTERNS.some((pattern) => filename.includes(pattern));
}

function isStackFrameArray(value: unknown): value is StackFrame[] {
  return Array.isArray(value);
}

export function filterUserStacktrace(stacktrace: StackFrame[] | unknown): StackFrame[] {
  if (!isStackFrameArray(stacktrace)) return [];
  return stacktrace.filter((frame) => isUserCode(frame.filename));
}

export function getMostRelevantFrame(stacktrace: StackFrame[] | unknown): StackFrame | null {
  if (!isStackFrameArray(stacktrace)) return null;
  // Stacktraces are usually ordered from oldest to newest (bottom to top)
  // We want the newest frame that is user code.
  const userFrames = filterUserStacktrace(stacktrace);
  return userFrames.length > 0 ? userFrames[userFrames.length - 1] : null;
}

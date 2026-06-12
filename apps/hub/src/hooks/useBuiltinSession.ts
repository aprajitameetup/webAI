import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeAvailability } from "../lib/builtinAI";

export type SessionState =
  | "detecting"
  | "unavailable"
  | "ready"
  | "downloading"
  | "running"
  | "error";

export interface BuiltinSessionConfig<S, I> {
  /** Resolve the API's raw availability value (or throw / be absent → unavailable). */
  availability: () => Promise<unknown>;
  /** Create the session; call `onProgress(0..1)` for download progress. */
  create: (onProgress: (p: number) => void) => Promise<S>;
  /** Run the session on `input`; call `onText` with the cumulative text to display. */
  run: (session: S, input: I, onText: (text: string) => void) => Promise<void>;
}

export function useBuiltinSession<S, I>(cfg: BuiltinSessionConfig<S, I>) {
  const [state, setState] = useState<SessionState>("detecting");
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<S | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => cfg.availability())
      .then((raw) => {
        if (!alive) return;
        setState(normalizeAvailability(raw) === "unavailable" ? "unavailable" : "ready");
      })
      .catch(() => {
        if (alive) setState("unavailable");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    sessionRef.current = null;
    setOutput("");
    setError(null);
    setState((s) => (s === "unavailable" ? s : "ready"));
  }, []);

  const run = useCallback(
    async (input: I) => {
      setError(null);
      try {
        if (!sessionRef.current) {
          setState("downloading");
          setProgress(0);
          sessionRef.current = await cfg.create((p) => setProgress(p));
        }
        setState("running");
        setOutput("");
        await cfg.run(sessionRef.current, input, (text) => setOutput(text));
        setState("ready");
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
        setState("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { state, progress, output, error, run, reset };
}

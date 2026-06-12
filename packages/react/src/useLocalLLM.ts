import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEngine,
  type Engine,
  type Message,
  type CreateEngineOptions,
  type EngineSource,
} from "@webai/core";

export type LLMStatus =
  | "detecting"
  | "loading"
  | "ready"
  | "streaming"
  | "error";

export function useLocalLLM(opts: CreateEngineOptions = {}) {
  const [status, setStatus] = useState<LLMStatus>("detecting");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [source, setSource] = useState<EngineSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus("detecting");
    createEngine({
      ...opts,
      onProgress: (p) => {
        if (alive) {
          setStatus("loading");
          setProgress(p.progress);
          setProgressText(p.text);
        }
      },
    })
      .then((engine) => {
        if (!alive) return;
        engineRef.current = engine;
        setSource(engine.source);
        setStatus("ready");
      })
      .catch((e) => {
        if (alive) {
          setError(String(e?.message ?? e));
          setStatus("error");
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(
    async (text: string) => {
      const engine = engineRef.current;
      if (!engine) return;
      const history = [...messages, { role: "user", content: text } as Message];
      setMessages([...history, { role: "assistant", content: "" }]);
      setStatus("streaming");
      try {
        let acc = "";
        for await (const tok of engine.chat(history)) {
          if (tok.done) break;
          acc += tok.delta;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: acc };
            return next;
          });
        }
        setStatus("ready");
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
        setStatus("error");
      }
    },
    [messages]
  );

  return { status, progress, progressText, messages, source, error, send };
}

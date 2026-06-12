export type Availability = "available" | "downloadable" | "unavailable";

/** The six Built-in AI global classes Chrome exposes. */
export const API_KEYS = [
  "LanguageModel",
  "Summarizer",
  "Writer",
  "Rewriter",
  "Translator",
  "LanguageDetector",
] as const;
export type ApiKey = (typeof API_KEYS)[number];

export const API_LABELS: Record<ApiKey, { name: string; detail: string }> = {
  LanguageModel: { name: "Prompt API", detail: "LanguageModel — chat" },
  Summarizer: { name: "Summarizer", detail: "text → summary" },
  Writer: { name: "Writer", detail: "generate prose" },
  Rewriter: { name: "Rewriter", detail: "rephrase text" },
  Translator: { name: "Translator", detail: "translate text" },
  LanguageDetector: { name: "Language Detector", detail: "detect language" },
};

/**
 * Normalize the various availability strings the API has used across origin trials
 * (`readily`/`after-download`/`no` → and the current `available`/`downloadable`/
 * `downloading`/`unavailable`) into a coarse three-state enum. Unknown input → "unavailable".
 */
export function normalizeAvailability(raw: unknown): Availability {
  switch (raw) {
    case "available":
    case "readily":
      return "available";
    case "downloadable":
    case "downloading":
    case "after-download":
      return "downloadable";
    default:
      return "unavailable";
  }
}

async function probeOne(key: ApiKey): Promise<Availability> {
  try {
    const api = (self as any)[key];
    if (!api || typeof api.availability !== "function") return "unavailable";
    // Translator requires a language pair to report availability.
    const raw =
      key === "Translator"
        ? await api.availability({ sourceLanguage: "en", targetLanguage: "es" })
        : await api.availability();
    return normalizeAvailability(raw);
  } catch {
    return "unavailable";
  }
}

/** Probe all six APIs. Never rejects; absent/erroring APIs report "unavailable". */
export async function probeBuiltinAI(): Promise<Record<ApiKey, Availability>> {
  const entries = await Promise.all(
    API_KEYS.map(async (key) => [key, await probeOne(key)] as const),
  );
  return Object.fromEntries(entries) as Record<ApiKey, Availability>;
}

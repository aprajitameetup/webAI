/**
 * A small, spec-shaped ModelContext for the demo.
 * If the browser already ships document.modelContext (WebMCP), the demo uses that.
 * If not, this class gives the page the same surface so the contract can still be shown.
 *
 * Shape follows the WebMCP draft (webmachinelearning.github.io/webmcp):
 *   registerTool(tool, { signal }), getTools(), executeTool(tool, input, { signal }), "toolchange" event.
 * There is no public unregisterTool: aborting the signal passed to registerTool unregisters the tool.
 */

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
  debugging?: boolean;
}

export interface ToolExecuteOptions {
  signal: AbortSignal;
}

export interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (input: Record<string, unknown>, options: ToolExecuteOptions) => Promise<unknown>;
  annotations?: ToolAnnotations;
}

export interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Required<ToolAnnotations>;
  origin: string;
}

export interface RegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface ModelContextLike {
  registerTool(tool: ModelContextTool, options?: RegisterToolOptions): Promise<void>;
  getTools(): Promise<RegisteredTool[]>;
  executeTool(tool: RegisteredTool | string, input?: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<string>;
  addEventListener(type: "toolchange", listener: () => void): void;
  removeEventListener(type: "toolchange", listener: () => void): void;
}

/** Tool names: 1 to 128 characters, ASCII letters, digits, underscore, hyphen, dot. */
const NAME = /^[A-Za-z0-9_.-]{1,128}$/;

export class ModelContextShim extends EventTarget implements ModelContextLike {
  private tools = new Map<string, ModelContextTool>();

  constructor(private origin = "local") {
    super();
  }

  async registerTool(tool: ModelContextTool, options: RegisterToolOptions = {}): Promise<void> {
    if (!NAME.test(tool.name)) throw new TypeError(`Invalid tool name "${tool.name}": use 1 to 128 of A-Z a-z 0-9 _ - .`);
    if (!tool.description || !tool.description.trim()) throw new TypeError("A tool needs a non-empty description");
    if (typeof tool.execute !== "function") throw new TypeError("A tool needs an execute function");
    if (this.tools.has(tool.name)) throw new Error(`InvalidStateError: a tool named "${tool.name}" is already registered`);
    if (options.signal?.aborted) return;

    this.tools.set(tool.name, tool);
    options.signal?.addEventListener(
      "abort",
      () => {
        if (this.tools.get(tool.name) === tool) {
          this.tools.delete(tool.name);
          this.dispatchEvent(new Event("toolchange"));
        }
      },
      { once: true },
    );
    this.dispatchEvent(new Event("toolchange"));
  }

  async getTools(): Promise<RegisteredTool[]> {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: t.inputSchema ?? { type: "object", properties: {} },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
        consequentialHint: false,
        debugging: false,
        ...t.annotations,
      },
      origin: this.origin,
    }));
  }

  /** Resolves to the stringified result, as the draft specifies. */
  async executeTool(tool: RegisteredTool | string, input: Record<string, unknown> = {}, options: { signal?: AbortSignal } = {}): Promise<string> {
    const name = typeof tool === "string" ? tool : tool.name;
    const found = this.tools.get(name);
    if (!found) throw new Error(`NotFoundError: no tool named "${name}"`);
    const ac = new AbortController();
    options.signal?.addEventListener("abort", () => ac.abort(), { once: true });
    const result = await found.execute(input, { signal: ac.signal });
    return typeof result === "string" ? result : JSON.stringify(result);
  }
}

/** Use the browser's own implementation when it exists, otherwise attach the shim. */
export function installModelContext(target: { modelContext?: unknown }): { ctx: ModelContextLike; source: "native" | "shim" } {
  if (target.modelContext instanceof ModelContextShim) return { ctx: target.modelContext, source: "shim" };
  if (target.modelContext) return { ctx: target.modelContext as ModelContextLike, source: "native" };
  const shim = new ModelContextShim();
  Object.defineProperty(target, "modelContext", { value: shim, configurable: true });
  return { ctx: shim, source: "shim" };
}

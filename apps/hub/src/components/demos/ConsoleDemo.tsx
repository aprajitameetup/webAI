import React, { useEffect, useMemo, useState } from "react";
import { installModelContext } from "../../lib/webmcp";
import { Cart } from "../../lib/shop";
import { registerShopTools } from "../../lib/shopTools";
import ShopSite, { ShopLayout } from "./ShopSite";

const SNIPPETS: { title: string; hint: string; code: string }[] = [
  {
    title: "Scrape the page",
    hint: "selectors on the markup",
    code: `[...document.querySelectorAll('#shop [class*=Card_card__]')]
  .filter(c => /sev usal/i.test(c.innerText))
  .map(c => ({
    name: c.querySelector('h3').innerText,
    restaurant: c.querySelector('[class*=Card_sub__]').innerText.split(' · ')[0],
    price: +c.querySelector('[class*=Card_price__]').innerText.replace(/\\D/g, '')
  }))
  .filter(d => d.price < 100)
  .sort((a, b) => a.price - b.price)[0]`,
  },
  {
    title: "Ask the page for its tools",
    hint: "what it offers",
    code: `await document.modelContext.getTools()`,
  },
  {
    title: "Call a tool",
    hint: "the same question",
    code: `await document.modelContext.executeTool('search_dishes', {
  query: 'sev usal', maxPrice: 99, sortBy: 'price', limit: 1
})`,
  },
  {
    title: "Act on the page",
    hint: "watch the cart",
    code: `await document.modelContext.executeTool('add_to_cart', { id: 'd1' })`,
  },
];

export default function ConsoleDemo() {
  const cart = useMemo(() => new Cart(), []);
  const { ctx } = useMemo(() => installModelContext(document as unknown as { modelContext?: unknown }), []);
  const [layout, setLayout] = useState<ShopLayout>("original");
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    registerShopTools(ctx, cart, ac.signal).catch(() => {});
    return () => ac.abort();
  }, [ctx, cart]);

  const copy = async (i: number) => {
    try {
      await navigator.clipboard.writeText(SNIPPETS[i].code);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard can be blocked */
    }
  };

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">⌨️ Live: find something from the console</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--muted)" }}>Site layout</span>
          <button className={layout === "original" ? "btn" : "btn ghost"} onClick={() => setLayout("original")}>Original</button>
          <button className={layout === "redesigned" ? "btn" : "btn ghost"} onClick={() => setLayout("redesigned")}>Redesigned</button>
          <button className="btn ghost" onClick={() => cart.clear()}>Empty cart</button>
        </div>
      </div>

      <div style={{ fontSize: 13, marginBottom: 10 }}>
        <b>Task:</b> find the cheapest Sev Usal under ₹100.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: "var(--surface)", padding: "6px 10px", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--border)", fontFamily: "monospace" }}>
            https://plateful.example/vadodara
          </div>
          <div style={{ height: 480, overflow: "auto" }}>
            <ShopSite layout={layout} cart={cart} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Open DevTools (F12), Console, then paste:</div>
          {SNIPPETS.map((s, i) => (
            <div key={s.title} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, background: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>
                  <b>{s.title}</b> <span style={{ color: "var(--muted)" }}>· {s.hint}</span>
                </span>
                <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => copy(i)}>
                  {copied === i ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="demo-out" style={{ margin: 0, maxHeight: 150, fontSize: 11 }}>{s.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

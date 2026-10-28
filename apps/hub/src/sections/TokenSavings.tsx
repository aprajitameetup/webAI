import React from "react";
import BeforeTheWireDemo from "../components/demos/BeforeTheWireDemo";
import AfterTheWireDemo from "../components/demos/AfterTheWireDemo";

export default function TokenSavings() {
  return (
    <>
      <div className="eyebrow">Live demo · The Cheapest Token</div>
      <h1>Before the wire, after the wire</h1>
      <p className="lead">
        Two places to save tokens. <b>Before the wire</b>, the client decides what leaves the device. <b>After the wire</b>, the agent runtime decides how much
        accumulates while it works. Nothing on this page calls a model API, so it is safe to run on stage with the Wi-Fi off.
      </p>

      <h2>🚪 Before the wire: a gate on the device</h2>
      <p>
        Clean the payload, let a local router decide, and answer on the device when the task fits. Watch the token bars shrink and the router flip from server
        to device. The counter shows fetch/XHR requests made while this panel is open.
      </p>
      <BeforeTheWireDemo />

      <h2>🔁 After the wire: a real agent loop</h2>
      <p>
        Every turn resends the history, so cost grows with the square of the turns. This runs a real agent loop with a scripted stand-in for the model: the
        message array, the cache and four levers are real code (open "Show the real code" to read it). Switch the levers on one at a time and watch the curve
        bend, and read the log of what the code just did.
      </p>
      <AfterTheWireDemo />

      <h2>Run of show</h2>
      <div className="stacklayer"><div className="num">1</div><div className="ltext"><b>Show the mess</b> &nbsp;<span>raw payload, about 2,400 tokens, router says <code>server</code></span></div></div>
      <div className="stacklayer"><div className="num">2</div><div className="ltext"><b>Tick 1, 2, 3</b> &nbsp;<span>dedupe takes it to about 1,300, truncate to about 400: the bars drop and the router flips to <code>device</code></span></div></div>
      <div className="stacklayer"><div className="num">3</div><div className="ltext"><b>Answer on the device</b> &nbsp;<span>open DevTools, Network tab: no AI request. The counter stays at 0</span></div></div>
      <div className="stacklayer"><div className="num">4</div><div className="ltext"><b>Naive loop</b> &nbsp;<span>about $42 for 50 turns</span></div></div>
      <div className="stacklayer"><div className="num">5</div><div className="ltext"><b>+ prompt caching</b> &nbsp;<span>about $8, the biggest single lever</span></div></div>
      <div className="stacklayer"><div className="num">6</div><div className="ltext"><b>+ compaction</b> &nbsp;<span>about $9.4, slightly <i>more</i> than caching alone: the summary call and the cache rewrite cost something. Compaction is for context limits, not always for price</span></div></div>
      <div className="stacklayer"><div className="num">7</div><div className="ltext"><b>Tool-heavy, all levers</b> &nbsp;<span>about $57 naive down to about $9 with caching, compaction, tool-result clearing and a 40-turn budget</span></div></div>
      <div className="stacklayer"><div className="num">8</div><div className="ltext"><b>Stuck agent</b> &nbsp;<span>a loop that repeats a failing call: about $142 over 100 turns, stopped on the third identical call at about $4. Open "Show the real code" and point at <code>repeatedCall</code></span></div></div>

      <div className="takeaway">
        <b>Send less, then keep what you sent small.</b> The token estimate is about 4 characters per token, and the model in the loop is scripted with illustrative prices,
        so quote the shape of the curve, not the dollar figure.
      </div>
    </>
  );
}

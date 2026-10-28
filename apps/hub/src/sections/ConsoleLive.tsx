import React from "react";
import ConsoleDemo from "../components/demos/ConsoleDemo";

export default function ConsoleLive() {
  return (
    <>
      <div className="eyebrow">Live demo · WebMCP</div>
      <h1>From the console</h1>
      <p className="lead">
        A busy ordering site, built like a real one. The same question asked two ways, typed straight into the browser console: first with selectors on the
        markup, then through the tools the page registered.
      </p>

      <ConsoleDemo />

      <h2>Run of show</h2>
      <div className="stacklayer"><div className="num">1</div><div className="ltext"><b>Scrape</b> &nbsp;<span>paste the first query: it works, and it is long. Notice the generated class names</span></div></div>
      <div className="stacklayer"><div className="num">2</div><div className="ltext"><b>Redesign</b> &nbsp;<span>click Redesigned and run it again: nothing comes back</span></div></div>
      <div className="stacklayer"><div className="num">3</div><div className="ltext"><b>Ask the page</b> &nbsp;<span><code>getTools()</code>: the page lists its own tools, with schemas</span></div></div>
      <div className="stacklayer"><div className="num">4</div><div className="ltext"><b>Call a tool</b> &nbsp;<span>same question, one short call. Switch the layout back and forth: it does not care</span></div></div>
      <div className="stacklayer"><div className="num">5</div><div className="ltext"><b>Act</b> &nbsp;<span><code>add_to_cart</code>: the cart on the page changes</span></div></div>
    </>
  );
}

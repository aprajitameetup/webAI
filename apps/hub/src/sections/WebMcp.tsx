import React from "react";
import WebMcpDemo from "../components/demos/WebMcpDemo";

export default function WebMcp() {
  return (
    <>
      <div className="eyebrow">Live demo · WebMCP</div>
      <h1>WebMCP: let the page say what it can do</h1>
      <p className="lead">
        WebMCP is a proposed web standard that lets a web page publish its own actions as <b>tools</b> that an AI agent can discover and call. Today an
        agent has to read the page like a person would, through its HTML or a screenshot, and guess. With WebMCP the page tells the agent directly.
      </p>

      <h2>What is a tool?</h2>
      <p>A page registers each tool in JavaScript, and the browser makes the list available to agents. A tool has four parts:</p>
      <div className="stacklayer"><div className="num">1</div><div className="ltext"><b>name</b> &nbsp;<span>what the agent calls it, for example <code>get_incidents</code></span></div></div>
      <div className="stacklayer"><div className="num">2</div><div className="ltext"><b>description</b> &nbsp;<span>plain language telling the agent when to use it</span></div></div>
      <div className="stacklayer"><div className="num">3</div><div className="ltext"><b>input schema</b> &nbsp;<span>a JSON Schema describing the parameters it accepts</span></div></div>
      <div className="stacklayer"><div className="num">4</div><div className="ltext"><b>execute</b> &nbsp;<span>the function that runs in the page, with the user's own session, and returns the result</span></div></div>
      <p>
        The page calls <code>document.modelContext.registerTool()</code> to publish a tool. An agent calls <code>getTools()</code> to see what is on offer
        and <code>executeTool()</code> to run one. Passing an <code>AbortSignal</code> when registering is how a page removes a tool again.
      </p>

      <h2>Live: the same task, three ways</h2>
      <p>
        One page, one task. First a caller reads the HTML and finds values with selectors. Then it uses the tool the page registered. Then the tool itself
        is optimised.
      </p>

      <WebMcpDemo />

      <h2>Run of show</h2>
      <div className="stacklayer"><div className="num">1</div><div className="ltext"><b>Scrape the original page</b> &nbsp;<span>it works, and the caller reads the whole table. Open the scraper: every value hangs on a class name</span></div></div>
      <div className="stacklayer"><div className="num">2</div><div className="ltext"><b>Redesign the page, scrape again</b> &nbsp;<span>same data on screen, the selector matches nothing, the run fails</span></div></div>
      <div className="stacklayer"><div className="num">3</div><div className="ltext"><b>Call the tool</b> &nbsp;<span>the page declared a name, a description and a schema. Switch the layout back and forth: the call does not care</span></div></div>
      <div className="stacklayer"><div className="num">4</div><div className="ltext"><b>Filter on the page</b> &nbsp;<span>tick it: the schema grows parameters, the caller reads them and asks for one row</span></div></div>
      <div className="stacklayer"><div className="num">5</div><div className="ltext"><b>Return only what is needed</b> &nbsp;<span>tick it too, call again, and read the bars: they show how much the tool sends back, nothing more</span></div></div>
      <div className="stacklayer"><div className="num">6</div><div className="ltext"><b>Get the call wrong</b> &nbsp;<span>call with the typo "biling". A bare <code>ERR_400</code> leaves the caller stuck. Tick the errors switch and call again: the error lists the valid values and the caller retries</span></div></div>

      <div className="takeaway">
        <b>The page decides what it exposes.</b> Scraping depends on markup, a tool depends on a contract the page controls, and a contract can be tuned: what
        goes in, what comes back, and what an error says. Token counts are an estimate of 4 characters per token.
      </div>
    </>
  );
}

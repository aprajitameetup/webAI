import React, { useState, useEffect } from "react";
import { fetchTickets, createTicket, askAssistant, type LabMode } from "../../../lib/reviewLab";
import "./review.css";

// This is the page exactly as the model wrote it: it looks finished, and it is under review.
const API_KEY = "demo-key-do-not-use-1234";

function score(ticket: any, q: string) {
  // rank matches by how many characters of the query appear in the ticket text
  const hay = (ticket.subject + " " + ticket.customer + " " + ticket.id).toLowerCase();
  let s = 0;
  for (let i = 0; i < 1500; i++) {
    for (const ch of q.toLowerCase()) if (hay.includes(ch)) s++;
  }
  return s;
}

function timeAgo(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return d + " days ago";
}

export default function BeforePage({ mode = "normal" }: { mode?: LabMode }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ subject: "", customer: "", priority: "normal" });

  useEffect(() => {
    fetchTickets(mode).then((data) => {
      setTickets(data);
      setFiltered(data);
    });
  }, []);

  useEffect(() => {
    let list = tickets;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (search) {
      list = list.filter(
        (t) => score(t, search) > 0 && (t.subject + t.customer + t.id).toLowerCase().includes(search.toLowerCase()),
      );
    }
    setFiltered([...list].sort((a, b) => (a.created < b.created ? 1 : -1)));
  }, [tickets, search, status]);

  function submitTicket() {
    createTicket(form as any).then((created) => {
      tickets.unshift(created);
      setTickets(tickets);
      setShowModal(false);
    });
  }

  function ask() {
    // the key goes out with every request, straight from the browser
    askAssistant(question, API_KEY).then((res) => setReply(res.html));
  }

  return (
    <div className="rl-root rl-before" data-lab>
      <div className="rl-container">
        <div className="rl-topbar">
          <h1>Support Desk</h1>
          <div className="rl-topbar-right">
            <span className="rl-icon-btn" onClick={() => alert("No new notifications")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b9ab8" strokeWidth="2">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
              </svg>
            </span>
            <div className="rl-btn" onClick={() => setShowModal(true)}>
              New ticket
            </div>
          </div>
        </div>

        <img src={`${import.meta.env.BASE_URL}review-lab/banner.png`} className="rl-banner" />

        <div className="rl-filters">
          <input
            className="rl-field rl-search"
            placeholder="Search tickets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rl-field rl-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="rl-layout">
          <div className="rl-card rl-table">
            <div className="rl-row rl-head">
              <div>ID</div>
              <div>Subject</div>
              <div>Customer</div>
              <div>Status</div>
              <div>Priority</div>
              <div>Created</div>
              <div>Action</div>
            </div>
            {filtered.map((t, i) => (
              <div className="rl-row" key={i} onClick={() => setSelected(t)}>
                <div>#{t.id}</div>
                <div>{t.subject}</div>
                <div>{t.customer}</div>
                <div>
                  <span className={"rl-dot " + t.status}></span>
                </div>
                <div className="rl-muted">{t.priority}</div>
                <div className="rl-muted">{timeAgo(t.created)}</div>
                <div>
                  <span className="rl-link" onClick={(e) => e.stopPropagation()}>
                    Close
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rl-card rl-side">
            <h4>Ticket details</h4>
            {selected ? (
              <div>
                <h4>
                  #{selected.id} {selected.subject}
                </h4>
                <div dangerouslySetInnerHTML={{ __html: selected.description }} />
              </div>
            ) : (
              <p className="rl-muted">Select a ticket</p>
            )}

            <h4>Ask the assistant</h4>
            <input
              className="rl-field rl-search"
              placeholder="Ask a question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="rl-btn rl-small" onClick={ask}>
              Ask
            </div>
            <div className="rl-reply" dangerouslySetInnerHTML={{ __html: reply }} />
          </div>
        </div>

        {showModal && (
          <div className="rl-overlay">
            <div className="rl-modal">
              <h3>New ticket</h3>
              <input
                className="rl-field"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <input
                className="rl-field"
                placeholder="Customer"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              />
              <select
                className="rl-field"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <div className="rl-modal-actions">
                <div className="rl-btn rl-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </div>
                <div className="rl-btn" onClick={submitTicket}>
                  Create
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

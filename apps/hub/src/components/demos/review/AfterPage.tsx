import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  askAssistant,
  createTicket,
  fetchTickets,
  filterTickets,
  htmlToText,
  relativeTime,
  type LabMode,
  type NewTicketInput,
  type Ticket,
  type TicketStatus,
} from "../../../lib/reviewLab";
import "./review.css";

const PAGE_SIZE = 25;

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; tickets: Ticket[] };

function useTickets(mode: LabMode) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoad({ state: "loading" });
    fetchTickets(mode, ctrl.signal)
      .then((tickets) => setLoad({ state: "ready", tickets }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setLoad({ state: "error", message: e.message });
      });
    return () => ctrl.abort();
  }, [mode, attempt]);

  return { load, retry: () => setAttempt((n) => n + 1), setLoad };
}

function StatusBadge({ status }: { status: TicketStatus }) {
  // colour is never the only signal: each status has its own shape and a word
  const shape =
    status === "open" ? (
      <circle cx="6" cy="6" r="5" fill="#b91c1c" />
    ) : status === "pending" ? (
      <rect x="1" y="1" width="10" height="10" fill="#b45309" />
    ) : (
      <path d="M1 11 L6 1 L11 11 Z" fill="#15803d" />
    );
  return (
    <span className="rl-status">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        {shape}
      </svg>
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}

function NewTicketDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (t: Ticket) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<NewTicketInput>({ subject: "", customer: "", priority: "normal" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal(); // native modal: focus trap, Esc to close, focus returns to the opener
    if (!open && d.open) d.close();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const t = await createTicket(form);
    setSaving(false);
    setForm({ subject: "", customer: "", priority: "normal" });
    onCreated(t);
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="rl-new-title">
      <form onSubmit={submit}>
        <h2 id="rl-new-title" style={{ margin: 0, fontSize: 18 }}>
          New ticket
        </h2>
        <label>
          Subject
          <input className="rl-field" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </label>
        <label>
          Customer
          <input className="rl-field" required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
        </label>
        <label>
          Priority
          <select
            className="rl-field"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as NewTicketInput["priority"] })}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <div className="rl-modal-actions">
          <button type="button" className="rl-btn rl-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rl-btn" disabled={saving}>
            {saving ? "Creating" : "Create"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function AfterPage({ mode = "normal" }: { mode?: LabMode }) {
  const { load, retry, setLoad } = useTickets(mode);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [asking, setAsking] = useState(false);

  const tickets = load.state === "ready" ? load.tickets : [];
  const filtered = useMemo(() => filterTickets(tickets, deferredSearch, status), [tickets, deferredSearch, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => setPage(0), [deferredSearch, status]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setAsking(true);
    const res = await askAssistant(question);
    setReply(res.text); // plain text: never inserted as markup
    setAsking(false);
  }

  function closeTicket(id: number) {
    if (load.state !== "ready") return;
    setLoad({ state: "ready", tickets: load.tickets.map((t) => (t.id === id ? { ...t, status: "closed" } : t)) });
  }

  return (
    <div className="rl-root rl-after" data-lab>
      <div className="rl-container">
        <header className="rl-topbar">
          <h1>Support Desk</h1>
          <div className="rl-topbar-right">
            <button className="rl-icon-btn" aria-label="Notifications" onClick={() => setReply("No new notifications")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e8" strokeWidth="2" aria-hidden="true">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
              </svg>
            </button>
            <button className="rl-btn" onClick={() => setShowModal(true)}>
              New ticket
            </button>
          </div>
        </header>

        <img
          src={`${import.meta.env.BASE_URL}review-lab/banner.webp`}
          className="rl-banner"
          width={1200}
          height={300}
          alt=""
          decoding="async"
        />

        <div className="rl-filters" role="search">
          <label className="rl-visually-hidden" htmlFor="rl-q">
            Search tickets
          </label>
          <input
            id="rl-q"
            type="search"
            className="rl-field rl-search"
            placeholder="Search tickets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="rl-visually-hidden" htmlFor="rl-status">
            Filter by status
          </label>
          <select id="rl-status" className="rl-field rl-select" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | "all")}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <main className="rl-layout">
          <section className="rl-card rl-tickets" aria-labelledby="rl-tickets-title">
            <div className="rl-table-wrap">
              <table>
                <caption id="rl-tickets-title">
                  Tickets{" "}
                  <span className="rl-muted" aria-live="polite" role="status">
                    {load.state === "ready" ? `${filtered.length} found` : ""}
                  </span>
                </caption>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Subject</th>
                    <th scope="col" className="rl-hide-sm">
                      Customer
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col" className="rl-hide-sm">
                      Priority
                    </th>
                    <th scope="col" className="rl-hide-sm">
                      Created
                    </th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                {load.state === "ready" && (
                  <tbody>
                    {visible.map((t) => (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td>{t.subject}</td>
                        <td className="rl-hide-sm">{t.customer}</td>
                        <td>
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="rl-muted rl-hide-sm">{t.priority}</td>
                        <td className="rl-muted rl-hide-sm">{relativeTime(t.created, Date.UTC(2026, 10, 12))}</td>
                        <td>
                          <button className="rl-link-btn" onClick={() => setSelected(t)}>
                            View<span className="rl-visually-hidden"> ticket {t.id}</span>
                          </button>
                          {t.status !== "closed" && (
                            <button className="rl-link-btn" onClick={() => closeTicket(t.id)}>
                              Close<span className="rl-visually-hidden"> ticket {t.id}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {load.state === "loading" && (
              <div role="status" aria-live="polite">
                <span className="rl-visually-hidden">Loading tickets</span>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="rl-skeleton" aria-hidden="true" />
                ))}
              </div>
            )}
            {load.state === "error" && (
              <div className="rl-notice" role="alert">
                <p>Tickets could not be loaded: {load.message}.</p>
                <button className="rl-btn" onClick={retry}>
                  Try again
                </button>
              </div>
            )}
            {load.state === "ready" && filtered.length === 0 && (
              <div className="rl-notice">
                <p>{tickets.length === 0 ? "No tickets yet. Create the first one." : "No tickets match these filters."}</p>
                {tickets.length === 0 ? (
                  <button className="rl-btn" onClick={() => setShowModal(true)}>
                    New ticket
                  </button>
                ) : (
                  <button
                    className="rl-btn"
                    onClick={() => {
                      setSearch("");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {load.state === "ready" && filtered.length > 0 && (
              <nav className="rl-pager" aria-label="Ticket pages">
                <button className="rl-btn rl-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span>
                  Page {page + 1} of {pageCount}
                </span>
                <button className="rl-btn rl-ghost" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </nav>
            )}
          </section>

          <aside className="rl-card rl-side" aria-label="Details and assistant">
            <h2>Ticket details</h2>
            {selected ? (
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>
                  #{selected.id} {selected.subject}
                </h3>
                <p style={{ margin: 0 }}>{htmlToText(selected.description)}</p>
              </div>
            ) : (
              <p className="rl-muted">Select a ticket to see its details.</p>
            )}

            <h2>Ask the assistant</h2>
            <form onSubmit={ask}>
              <label className="rl-visually-hidden" htmlFor="rl-ask">
                Your question
              </label>
              <input
                id="rl-ask"
                className="rl-field rl-search"
                placeholder="Ask a question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button className="rl-btn rl-small" type="submit" disabled={asking || !question.trim()}>
                {asking ? "Asking" : "Ask"}
              </button>
            </form>
            <p className="rl-reply" role="status" aria-live="polite">
              {reply}
            </p>
          </aside>
        </main>

        <NewTicketDialog
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreated={(t) => {
            if (load.state === "ready") setLoad({ state: "ready", tickets: [t, ...load.tickets] });
            setShowModal(false);
          }}
        />
      </div>
    </div>
  );
}

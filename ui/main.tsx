import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { OfficeStage } from "./OfficeStage.js";
import { WorkBoard } from "./WorkBoard.js";
import { initialDemo, startDemoTask, advanceDemo } from "./demo.js";
import type { AgentSelection, TeamView } from "./officeGeometry.js";
import "./style.css";
import "./demo.css";
function App() {
  const [state, setState] = useState(() => initialDemo(Date.now())),
    [clock, setClock] = useState(Date.now()),
    [business, setBusiness] = useState("beleza"),
    [team, setTeam] = useState<TeamView>(() =>
      matchMedia("(max-width:700px)").matches ? "beleza" : "both",
    ),
    [view, setView] = useState("office"),
    [selection, setSelection] = useState<AgentSelection | null>(null),
    [collapsed, setCollapsed] = useState(
      () => matchMedia("(max-width:700px)").matches,
    ),
    [role, setRole] = useState("marketing"),
    [brief, setBrief] = useState(""),
    [error, setError] = useState(""),
    [opened, setOpened] = useState<string | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setClock(now);
      setState((s) => advanceDemo(s, now));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const b = state.businesses.find((b) => b.id === business)!,
    working = state.tasks.filter((t) => t.status === "working").length,
    done = state.tasks.filter((t) => t.status === "completed").length,
    r = state.roles.find((r) => r.id === selection?.roleId),
    chosen = state.businesses.find((b) => b.id === selection?.businessId),
    task = state.tasks.find((t) => t.id === opened);
  const choose = (id: string) => {
    setBusiness(id);
    setSelection(null);
    setTeam(id as TeamView);
  };
  const select = (s: AgentSelection) => {
    setSelection(s);
    setBusiness(s.businessId);
    setRole(s.roleId);
  };
  const reset = () => {
    setState(initialDemo(Date.now()));
    setBrief("");
    setError("");
    setOpened(null);
    setSelection(null);
  };
  const navigate = (next: string) => {
    setView(next);
    setOpened(null);
    setSelection(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div
      className={
        "app spatial-app public-demo " + (collapsed ? "nav-collapsed" : "")
      }
    >
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("office");
          }}
        >
          <span className="brand-mark">B/D</span>
          <span className="nav-label">
            <strong>Agent Studio</strong>
            <small>Your teams, together</small>
          </span>
        </a>
        <button
          className="collapse-nav"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? "→" : "← Collapse"}
        </button>
        <div className="business-switch">
          <span>Workspace</span>
          {state.businesses.map((b) => (
            <button
              key={b.id}
              aria-pressed={business === b.id}
              onClick={() => choose(b.id)}
            >
              <i className={"business-dot " + b.id} />
              <span className="nav-label">{b.short}</span>
            </button>
          ))}
        </div>
        <nav aria-label="Demo navigation">
          {[
            ["office", "◫", "Office"],
            ["tasks", "☷", "Demo tasks"],
            ["samples", "▧", "Sample outputs"],
            ["about", "◇", "About this demo"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              title={label}
              onClick={() => navigate(id)}
            >
              <span aria-hidden="true">{icon}</span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="nav-label">
            Public demo
            <br />
            Local simulation only
          </span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span className="breadcrumb">
            Workspace /{" "}
            <strong>
              {view === "office"
                ? "Office"
                : view === "tasks"
                  ? "Demo tasks"
                  : view === "samples"
                    ? "Sample outputs"
                    : "About"}
            </strong>
          </span>
          <div className="header-actions">
            <span className="demo-pill">Public demo</span>
            <button onClick={reset}>Reset demo ↺</button>
          </div>
        </header>
        <div className="demo-notice" role="note">
          <strong>Explore freely.</strong> Everything here is sample data and
          browser-only simulation. No real agents, accounts or business records
          are connected.
        </div>
        <div className="page-heading">
          <div>
            <p className="overline">Beleza Digital Media + Devsense</p>
            <h1>
              {view === "office"
                ? "Good work starts here."
                : view === "tasks"
                  ? "Follow the handoff."
                  : view === "samples"
                    ? "Ideas you can explore."
                    : "A studio for two teams."}
            </h1>
          </div>
          <a
            className="primary"
            href="#demo-brief"
            onClick={() => {
              if (view !== "office") setView("office");
            }}
          >
            Try a demo task ↗
          </a>
        </div>
        {view === "office" && (
          <>
            <div className="studio-overview">
              <span>
                <i className="dot green" />
                <strong>{working}</strong> simulated sessions
              </span>
              <span>22 desks · 2 teams · {done} sample tasks complete</span>
            </div>
            <div className="office-layout">
              <OfficeStage
                state={state}
                connected
                lastReceivedAt={clock}
                teamView={team}
                onTeamViewChange={setTeam}
                selection={selection}
                onSelect={select}
              />
              {selection && r && chosen ? (
                <aside
                  className="agent-inspector"
                  aria-label={`${chosen.short} ${r.name} demo details`}
                >
                  <div className="section-title">
                    <h2>{r.name}</h2>
                    <button
                      onClick={() => setSelection(null)}
                      aria-label="Close agent details"
                    >
                      ×
                    </button>
                  </div>
                  <p className="overline">{chosen.name}</p>
                  <div className="inspector-avatar">
                    {r.name
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <p>{r.description}</p>
                  <p className="hint">Demo role · no live worker connected.</p>
                  <a
                    className="primary"
                    href="#demo-brief"
                    onClick={() => setRole(r.id)}
                  >
                    Try this agent ↗
                  </a>
                  <h3>Sample activity</h3>
                  {state.tasks
                    .filter(
                      (t) => t.businessId === chosen.id && t.roleId === r.id,
                    )
                    .map((t) => (
                      <button
                        className="work-card"
                        key={t.id}
                        onClick={() => {
                          setOpened(t.id);
                          setView("tasks");
                        }}
                      >
                        {t.prompt}
                        <small>{t.status} · simulated</small>
                      </button>
                    ))}
                </aside>
              ) : (
                <aside className="manager-panel">
                  <p className="overline">Daily oversight · demo</p>
                  <h2>Manager desk</h2>
                  <p>A clear view of both teams.</p>
                  <div className="demo-metrics">
                    <div>
                      <strong>{working}/3</strong>
                      <small>Simulated sessions</small>
                    </div>
                    <div>
                      <strong>{done}</strong>
                      <small>Sample outputs</small>
                    </div>
                  </div>
                  <ol className="demo-steps">
                    <li>Marketing prepares a sample campaign.</li>
                    <li>Lead and design roles receive a simulated handoff.</li>
                    <li>Outputs become available for you to explore.</li>
                  </ol>
                  <p className="hint">
                    Try a desk, zoom into one team or write your own example
                    brief. Demo tasks finish in about ten seconds.
                  </p>
                  <button onClick={() => navigate("tasks")}>
                    Explore the task board →
                  </button>
                  <button onClick={() => navigate("samples")}>
                    View sample outputs →
                  </button>
                </aside>
              )}
            </div>
            <form
              id="demo-brief"
              className="task-dock"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  setState(
                    startDemoTask(
                      state,
                      { businessId: business, roleId: role, prompt: brief },
                      Date.now(),
                    ),
                  );
                  setBrief("");
                  setError("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <div className="dock-intro">
                <span className="dock-icon">↗</span>
                <div>
                  <h2>What would you ask your team?</h2>
                  <p>
                    Try a brief. Watch a simulated session. Explore a sample
                    result.
                  </p>
                </div>
                <span className="dock-capacity">{working}/3 demo slots</span>
              </div>
              <div className="dock-fields">
                <label>
                  Company
                  <select
                    value={business}
                    onChange={(e) => choose(e.target.value)}
                  >
                    {state.businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Agent
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {state.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="dock-brief">
                <span>Example instructions</span>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Try: Plan a sample Facebook campaign for a new service."
                  required
                />
              </label>
              <div className="dock-submit">
                <small>
                  Your text stays in this tab's memory. Refresh or Reset clears
                  it. This fixed-template demo does not use an AI model.
                </small>
                <button
                  className="primary"
                  disabled={working >= 3 || !brief.trim()}
                >
                  Run demo task ↗
                </button>
              </div>
              {error && <p role="alert">{error}</p>}
            </form>
            <div className="demo-board">
              <WorkBoard
                state={state}
                allocations={{
                  date: new Date(clock).toLocaleDateString("sv-SE", {
                    timeZone: "Africa/Johannesburg",
                  }),
                  availability: "available",
                  runStatus: "demo simulation",
                  blocker: null,
                  jobs: [],
                }}
                onOpenTask={(id) => {
                  setOpened(id);
                  setView("tasks");
                }}
              />
            </div>
          </>
        )}
        {view === "tasks" && (
          <>
            <p className="hint">
              These sessions are illustrative. Status changes come from a local
              timer.
            </p>
            {task ? (
              <article className="demo-output">
                <button onClick={() => setOpened(null)}>
                  ← All demo tasks
                </button>
                <p className="overline">
                  {
                    state.businesses.find((b) => b.id === task.businessId)
                      ?.short
                  }{" "}
                  · {state.roles.find((r) => r.id === task.roleId)?.name}
                </p>
                <h2>{task.prompt}</h2>
                <p>{task.status} · simulated</p>
                <pre>
                  {task.result ||
                    "A sample result will appear when this local simulation finishes."}
                </pre>
              </article>
            ) : (
              <WorkBoard
                state={state}
                allocations={{
                  date: new Date(clock).toLocaleDateString("sv-SE", {
                    timeZone: "Africa/Johannesburg",
                  }),
                  availability: "available",
                  runStatus: "demo simulation",
                  blocker: null,
                  jobs: [],
                }}
                onOpenTask={setOpened}
              />
            )}
          </>
        )}
        {view === "samples" && (
          <>
            <p className="hint">
              Original demonstration templates. These are not completed client
              work or verified research.
            </p>
            <div className="demo-samples">
              {state.businesses.map((b) => (
                <article key={b.id}>
                  <div className={"sample-poster " + b.id}>
                    <span>{b.short}</span>
                    <h2>
                      {b.id === "beleza"
                        ? "Make your next story count."
                        : "One idea. A clearer workflow."}
                    </h2>
                    <p>
                      {b.id === "beleza"
                        ? "A sample campaign direction for an everyday brand moment."
                        : "A sample discovery brief for a useful website or app."}
                    </p>
                    <small>Concept only · public demo</small>
                  </div>
                  <h3>{b.name}</h3>
                  <p>{b.description}</p>
                  <a href={b.website} target="_blank" rel="noreferrer">
                    Visit company website ↗
                  </a>
                </article>
              ))}
            </div>
            <h2>Simulated task outputs</h2>
            {state.drafts.length ? (
              state.drafts.map((d) => (
                <details className="demo-output" key={d.id}>
                  <summary>{d.title}</summary>
                  <pre>{d.content}</pre>
                </details>
              ))
            ) : (
              <p>
                Sample drafts appear as demo tasks finish. Explore the office or
                try your own example brief.
              </p>
            )}
          </>
        )}
        {view === "about" && (
          <article className="demo-output">
            <h2>One office. Two complementary teams.</h2>
            <p>
              Explore eleven roles for Beleza Digital Media and eleven for
              Devsense, from marketing and lead research to design, email drafts
              and quality review.
            </p>
            <h3>What this public version does</h3>
            <p>
              It renders the original 3D office, lets you inspect roles and
              simulates brief-to-output handoffs inside your browser. Example
              instructions are not sent anywhere or saved after you close or
              refresh this tab.
            </p>
            <h3>The working Studio stays private</h3>
            <p>
              The owner's operational platform uses its own authenticated
              service. This demo has no backend, sign-in, access keys, mailbox
              connection, social account connection or live Codex worker. It
              cannot send messages or publish posts.
            </p>
            <p>
              Built with React and Three.js. Hosted as a static GitHub Pages
              site.
            </p>
            <a
              href="https://github.com/Chedevs1111/agent-studio-demo"
              target="_blank"
              rel="noreferrer"
            >
              Explore the source on GitHub ↗
            </a>
          </article>
        )}
        <footer>
          Beleza + Devsense{" "}
          <span>Public demo · sample data · no real business activity</span>
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

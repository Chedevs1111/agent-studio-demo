import React from "react";
import type { State, DailyAllocations } from "./api.js";
export function WorkBoard({
  state,
  allocations,
  onOpenTask,
  businessId,
}: {
  state: State;
  allocations: DailyAllocations | null;
  onOpenTask: (id: string) => void;
  businessId?: string;
}) {
  const day =
    allocations?.date ??
    new Date().toLocaleDateString("sv-SE", { timeZone: "Africa/Johannesburg" });
  const tasks = state.tasks.filter(
    (t) =>
      (!businessId || t.businessId === businessId) &&
      new Date(t.createdAt).toLocaleDateString("sv-SE", {
        timeZone: "Africa/Johannesburg",
      }) === day,
  );
  const pending =
    allocations?.jobs.filter(
      (j) =>
        (!businessId || j.businessId === businessId) &&
        !state.tasks.some((t) => t.id === j.taskId),
    ) ?? [];
  const name = (b: string, r: string) =>
    `${state.businesses.find((x) => x.id === b)?.short ?? b} · ${state.roles.find((x) => x.id === r)?.name ?? r}`;
  return (
    <section className="work-board" aria-label="Daily work board">
      <div className="board-heading">
        <div>
          <h2>Today's work</h2>
          <p>{day} · South Africa time</p>
        </div>
        <span className="board-live">
          {allocations?.runStatus?.replaceAll("-", " ") ?? "Plan unavailable"}
        </span>
      </div>
      {allocations?.blocker && (
        <p className="board-blocker" role="status">
          {allocations.blocker} Recorded allocations are separate from running
          sessions.
        </p>
      )}
      {(!allocations || allocations.availability !== "available") && (
        <p className="hint">
          The daily allocation journal is unavailable. Actual sessions below
          remain visible; pending work is unknown.
        </p>
      )}
      <div className="board-columns">
        {[
          { title: "In progress", statuses: ["working", "waiting", "queued"] },
          { title: "Ready for review", statuses: ["completed"] },
          {
            title: "Needs attention",
            statuses: ["failed", "interrupted", "cancelled"],
          },
        ].map((column) => {
          const list = tasks.filter((t) => column.statuses.includes(t.status));
          return (
            <div className="board-column" key={column.title}>
              <h3>
                {column.title}
                <span>{list.length}</span>
              </h3>
              {list.length ? (
                list.map((t) => (
                  <button
                    key={t.id}
                    className={"work-card " + t.status}
                    onClick={() => onOpenTask(t.id)}
                  >
                    <strong>{name(t.businessId, t.roleId)}</strong>
                    <span>{t.prompt.slice(0, 110)}</span>
                    <small>
                      {t.status} · {t.files.length} files
                    </small>
                  </button>
                ))
              ) : (
                <p className="board-empty">No recorded sessions here.</p>
              )}
            </div>
          );
        })}
        <div className="board-column">
          <h3>
            Allocated{" "}
            <span>
              {allocations?.availability === "available" ? pending.length : "?"}
            </span>
          </h3>
          {pending.map((j) => (
            <article
              className="work-card planned"
              key={j.businessId + j.roleId}
            >
              <strong>{name(j.businessId, j.roleId)}</strong>
              <span>
                {j.taskId
                  ? "Session record awaits refresh"
                  : j.status.replaceAll("-", " ")}
              </span>
              <small>
                {j.dependsOn.length
                  ? "After " +
                    j.dependsOn
                      .map(
                        (r) => state.roles.find((x) => x.id === r)?.name ?? r,
                      )
                      .join(", ")
                  : "Waiting to start"}
              </small>
            </article>
          ))}
          {!pending.length && (
            <p className="board-empty">
              {allocations?.availability === "available"
                ? "No unstarted allocations recorded."
                : "Pending assignments are unknown."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

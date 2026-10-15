import React, { useEffect, useRef, useState } from "react";
import type { State } from "./api.js";
import type { AgentSelection, TeamView } from "./officeGeometry.js";
import { createOfficeScene, canAnimate3D } from "./officeScene.js";
import { mountOffice3D, type OfficeController } from "./office3D.js";
import { StudioOffice } from "./StudioOffice.js";
import { statusLabel } from "./officeRenderer.js";
export function OfficeStage({
  state,
  connected,
  lastReceivedAt,
  teamView,
  onTeamViewChange,
  selection,
  onSelect,
}: {
  state: State;
  connected: boolean;
  lastReceivedAt: number;
  teamView: TeamView;
  onTeamViewChange: (v: TeamView) => void;
  selection: AgentSelection | null;
  onSelect: (s: AgentSelection) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    section = useRef<HTMLElement>(null),
    controller = useRef<OfficeController | null>(null);
  const [fallback, setFallback] = useState(""),
    [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false),
    [hidden, setHidden] = useState(document.hidden),
    [tick, setTick] = useState(Date.now()),
    [fullscreenError, setFullscreenError] = useState("");
  const select = useRef(onSelect);
  select.current = onSelect;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      read = () => setReduced(media.matches),
      visibility = () => setHidden(document.hidden);
    read();
    media.addEventListener("change", read);
    document.addEventListener("visibilitychange", visibility);
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      media.removeEventListener("change", read);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (fallback || !canvas.current) return;
    const c = mountOffice3D(canvas.current, createOfficeScene(state), {
      onSelect: (s) => select.current(s),
      onUnavailable: setFallback,
    });
    controller.current = c;
    const observer = new ResizeObserver(() => c.resize());
    observer.observe(canvas.current);
    return () => {
      observer.disconnect();
      c.dispose();
      controller.current = null;
    };
  }, [fallback]);
  useEffect(() => {
    controller.current?.update(createOfficeScene(state));
  }, [state]);
  useEffect(() => {
    controller.current?.setView(teamView);
  }, [teamView]);
  useEffect(() => {
    controller.current?.setSelection(selection);
  }, [selection]);
  const animate = canAnimate3D(
    { connected, paused, reduced, hidden },
    lastReceivedAt,
    Math.max(tick, Date.now()),
  );
  useEffect(() => {
    controller.current?.setMotion(animate);
  }, [animate]);
  if (fallback)
    return (
      <div className="scene-fallback">
        <p role="status">{fallback}</p>
        <StudioOffice
          {...{
            state,
            connected,
            teamView,
            onTeamViewChange,
            selection,
            onSelect,
          }}
        />
      </div>
    );
  const desks = createOfficeScene(state).desks;
  return (
    <section
      className="office-stage"
      ref={section}
      aria-label="Original 3D agent office"
    >
      <div className="scene-toolbar">
        <div className="scene-title">
          <span className="scene-live-dot" />
          <strong>The office</strong>
          <span>22 desks · two teams</span>
        </div>
        <div className="scene-focus" aria-label="Office focus">
          {(["both", "beleza", "devsense"] as TeamView[]).map((v) => (
            <button
              key={v}
              aria-pressed={teamView === v}
              onClick={() => onTeamViewChange(v)}
            >
              {v === "both"
                ? "Both teams"
                : v === "beleza"
                  ? "Beleza"
                  : "Devsense"}
            </button>
          ))}
        </div>
      </div>
      {!connected || tick - lastReceivedAt > 10000 ? (
        <p role="status" className="scene-offline">
          Connection paused. Showing last received status.
        </p>
      ) : null}
      <div className="scene-viewport">
        <canvas
          ref={canvas}
          aria-label="3D desks for Beleza and Devsense. Use the agent list below for keyboard selection."
        />
        <div className="scene-watermark">
          Built for the way you work.
          <small>Beleza Digital Media + Devsense</small>
        </div>
        <div className="scene-controls">
          <button
            aria-label="Zoom out"
            onClick={() => controller.current?.zoomBy(-0.2)}
          >
            −
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => controller.current?.zoomBy(0.2)}
          >
            +
          </button>
          <button onClick={() => controller.current?.reset()}>
            Reset view
          </button>
          <button aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            {paused ? "Resume" : "Pause"} motion
          </button>
          <button
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await section.current?.requestFullscreen();
              } catch {
                setFullscreenError(
                  "Use the window controls to enlarge the office; fullscreen is unavailable.",
                );
              }
            }}
          >
            Fullscreen
          </button>
        </div>
      </div>
      {fullscreenError && <p role="status">{fullscreenError}</p>}
      <div className="scene-legend">
        <span>
          <i className="legend-dot working" />
          Working
        </span>
        <span>
          <i className="legend-dot completed" />
          Ready for review
        </span>
        <span>
          <i className="legend-dot failed" />
          Needs attention
        </span>
        <small>Drag to explore. Select a desk to open its work.</small>
      </div>
      <details className="scene-roster">
        <summary>
          Meet your agents{" "}
          <span>{desks.length} roles across both companies</span>
        </summary>
        <div className="scene-agent-grid">
          {desks
            .filter((d) => teamView === "both" || d.businessId === teamView)
            .map((d) => (
              <button
                key={d.key}
                onClick={() =>
                  onSelect({ businessId: d.businessId, roleId: d.roleId })
                }
              >
                <i className={"legend-dot " + d.status} />
                <span>
                  <strong>
                    {d.businessId === "beleza" ? "Beleza" : "Devsense"} ·{" "}
                    {d.label}
                  </strong>
                  <small>
                    {statusLabel(
                      d.status === "available" ? undefined : d.status,
                    )}
                    {d.activeCount > 1 ? ` · ${d.activeCount} sessions` : ""}
                  </small>
                </span>
              </button>
            ))}
        </div>
      </details>
    </section>
  );
}

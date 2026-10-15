import type { State, UITask } from "./api.js";
import { roles } from "./roles.js";
const businesses = [
  {
    id: "beleza",
    name: "Beleza Digital Media",
    short: "Beleza",
    website: "https://belezamedia.com",
    description: "Creative campaigns, brand storytelling and social content.",
  },
  {
    id: "devsense",
    name: "Devsense",
    short: "Devsense",
    website: "https://devsense.co.za",
    description: "AI systems, apps and websites.",
  },
];
function task(
  businessId: string,
  roleId: string,
  prompt: string,
  now: number,
  id: string,
  status: UITask["status"] = "working",
): UITask {
  return {
    id,
    businessId,
    roleId,
    prompt,
    status,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    activity:
      status === "working"
        ? "Simulating a sample brief"
        : "Waiting for a demo slot",
    result: "",
    threadId: "",
    events: [],
    workspace: "",
    requestId: id,
    files: [],
  };
}
export function initialDemo(now: number): State {
  return {
    businesses,
    roles: roles.map((r) => ({ ...r })),
    tasks: businesses.map((b) =>
      task(
        b.id,
        "marketing",
        `Build a sample daily campaign for ${b.short}.`,
        now,
        "demo-" + b.id + "-marketing",
      ),
    ),
    drafts: [],
  };
}
export function startDemoTask(
  state: State,
  input: { businessId: string; roleId: string; prompt: string },
  now: number,
): State {
  if (
    !state.businesses.some((b) => b.id === input.businessId) ||
    !state.roles.some((r) => r.id === input.roleId)
  )
    throw Error("Choose a company and agent.");
  if (!input.prompt.trim() || input.prompt.length > 2000)
    throw Error("Use between 1 and 2,000 characters.");
  if (state.tasks.filter((t) => t.status === "working").length >= 3)
    throw Error(
      "All three demo slots are busy. Wait for a sample task to finish.",
    );
  if (state.tasks.length >= 60)
    throw Error("Reset the demo to try more briefs.");
  return {
    ...state,
    tasks: [
      ...state.tasks,
      task(
        input.businessId,
        input.roleId,
        input.prompt.trim(),
        now,
        `demo-visitor-${now}-${state.tasks.length}`,
      ),
    ],
  };
}
export function advanceDemo(state: State, now: number): State {
  const ready = state.tasks.filter(
    (t) => t.status === "working" && now - Date.parse(t.updatedAt) >= 10000,
  );
  if (!ready.length) return state;
  const next: State = {
    ...state,
    tasks: state.tasks.map((t) => ({ ...t })),
    drafts: [...state.drafts],
  };
  for (const old of ready) {
    const t = next.tasks.find((t) => t.id === old.id)!;
    const name = state.businesses.find((b) => b.id === t.businessId)!.short;
    const role = state.roles.find((r) => r.id === t.roleId)!;
    t.status = "completed";
    t.updatedAt = new Date(now).toISOString();
    t.activity = "Sample ready to explore";
    t.result = `Illustrative sample for ${name} — ${role.name}\n\n1. Define one clear audience and outcome.\n2. Prepare a short, factual draft for owner review.\n3. Hand the brief to the next role.\n\nThis sample is generated locally from a fixed template. No research was performed, no account was accessed and no message was sent.`;
    t.events = [
      {
        time: t.updatedAt,
        type: "demo.completed",
        message: "Local simulation completed; no real worker ran.",
      },
    ];
    next.drafts.push({
      id: "sample-" + t.id,
      businessId: t.businessId,
      kind: role.kind,
      title: `${name} · ${role.name} sample`,
      content: t.result,
      reviewStatus: "draft",
      createdAt: t.updatedAt,
      updatedAt: t.updatedAt,
      revision: 1,
    });
    if (t.id === `demo-${t.businessId}-marketing`)
      for (const r of ["prospects", "design"])
        next.tasks.push(
          task(
            t.businessId,
            r,
            `Explore a sample ${r === "design" ? "visual brief" : "research checklist"} from the campaign handoff.`,
            now,
            `demo-${t.businessId}-${r}`,
            "queued",
          ),
        );
  }
  let capacity = 3 - next.tasks.filter((t) => t.status === "working").length;
  for (const t of next.tasks)
    if (t.status === "queued" && capacity > 0) {
      t.status = "working";
      t.updatedAt = new Date(now).toISOString();
      t.activity = "Simulating campaign handoff";
      capacity--;
    }
  return next;
}

// Public demo types only: no API client, worker connection or credentials.
import type { Task, Draft } from "../server/events.js";
export type UITask = Task & { files: { name: string; size: number }[] };
export type State = {
  businesses: {
    id: string;
    name: string;
    short: string;
    website: string;
    description: string;
  }[];
  roles: { id: string; name: string; description: string; kind: string }[];
  tasks: UITask[];
  drafts: Draft[];
};
export type DailyAllocations = {
  date: string;
  availability: "available" | "missing" | "invalid";
  runStatus: string | null;
  blocker: string | null;
  jobs: {
    businessId: string;
    roleId: string;
    taskId: string | null;
    status: string;
    dependsOn: string[];
  }[];
};

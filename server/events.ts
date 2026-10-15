export type Status =
  | "queued"
  | "working"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted";
export interface Task {
  id: string;
  businessId: string;
  roleId: string;
  prompt: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  activity: string;
  result: string;
  threadId: string;
  events: { time: string; type: string; message: string }[];
  error?: string;
  exitCode?: number;
  workspace: string;
  draftId?: string;
  requestId: string;
}
export interface Draft {
  id: string;
  businessId: string;
  kind: string;
  title: string;
  content: string;
  sourceTaskId?: string;
  reviewStatus: "draft" | "reviewed";
  createdAt: string;
  updatedAt: string;
  revision: number;
  scheduledAt?: string;
}
export interface Preferences {
  businessId: string;
  audience: string;
  region: string;
  mailboxProvider: string;
  senderName: string;
  dailyLimit: number;
  followupDays: number;
  reviewMode: "individual";
}

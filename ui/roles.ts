export const roles = [
  {
    id: "marketing",
    name: "Marketing planner",
    description: "Campaigns, positioning and calendars",
    kind: "calendar",
  },
  {
    id: "prospects",
    name: "Leads agent",
    description: "Public prospects with source evidence",
    kind: "prospect",
  },
  {
    id: "email",
    name: "Email assistant",
    description: "Cold emails and feedback drafts",
    kind: "email",
  },
  {
    id: "design",
    name: "Social designer",
    description: "Visual briefs and editable SVG designs",
    kind: "design",
  },
  {
    id: "social",
    name: "Social manager",
    description: "Captions and channel plans",
    kind: "social",
  },
  {
    id: "analytics",
    name: "Campaign analyst",
    description: "Reports from supplied evidence",
    kind: "report",
  },
  { id: "crm", name: "CRM coordinator", description: "Lead records, deduplication and pipeline ownership", kind: "prospect" },
  { id: "quality", name: "Quality reviewer", description: "Check campaign copy, visuals and delivery evidence", kind: "report" },
  { id: "followup", name: "Follow-up coordinator", description: "Plan follow-ups from verified sent and reply history", kind: "email" },
  { id: "proposals", name: "Proposal assistant", description: "Scope and proposal drafts from qualified enquiries", kind: "report" },
  { id: "inbox", name: "Inbox specialist", description: "Triage supplied business enquiries and feedback", kind: "feedback" },
] as const;

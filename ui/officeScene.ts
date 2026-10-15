import type { State } from "./api.js";
import type { Status } from "../server/events.js";
import type { AgentSelection } from "./officeGeometry.js";
import { selectOfficeSessions } from "./officeSessions.js";
export type DeskModel = AgentSelection & {
  key: string;
  label: string;
  status: Status | "available";
  taskId: string | null;
  activeCount: number;
  position: [number, number, number];
};
export type OfficeScene = { desks: DeskModel[] };
export function createOfficeScene(
  state: Pick<State, "businesses" | "roles" | "tasks">,
): OfficeScene {
  const sessions = selectOfficeSessions(state.tasks);
  return {
    desks: state.businesses.flatMap((business, b) =>
      state.roles.map((role, r) => {
        const key = business.id + ":" + role.id,
          session = sessions.get(key);
        return {
          key,
          businessId: business.id,
          roleId: role.id,
          label: role.name,
          status: session?.task.status ?? "available",
          taskId: session?.task.id ?? null,
          activeCount: session?.activeCount ?? 0,
          position: [
            (b === 0 ? -7 : 7) + ((r % 3) - 1) * 2.25,
            0,
            -4 + Math.floor(r / 3) * 2.5,
          ] as [number, number, number],
        };
      }),
    ),
  };
}
export function canAnimate3D(
  options: {
    connected: boolean;
    paused: boolean;
    reduced: boolean;
    hidden: boolean;
  },
  lastReceivedAt: number,
  now = Date.now(),
) {
  const age = now - lastReceivedAt;
  return (
    options.connected &&
    !options.paused &&
    !options.reduced &&
    !options.hidden &&
    Number.isFinite(age) &&
    age >= 0 &&
    age <= 10000
  );
}

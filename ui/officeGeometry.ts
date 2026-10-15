export type TeamView = "both" | "beleza" | "devsense";
export type AgentSelection = { businessId: string; roleId: string };
export type Desk = AgentSelection & {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type ViewportTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};
export function officeLayout(roleCount: number) {
  const extra = (Math.max(2, Math.ceil(roleCount / 3)) - 2) * 190;
  return { sceneHeight: 700 + extra, roomHeight: 640 + extra, floorHeight: 550 + extra, loungeY: 542 + extra, extra };
}
export function getDesks(businessIds: string[], roleIds: string[]): Desk[] {
  return businessIds.flatMap((businessId, b) =>
    roleIds.map((roleId, r) => ({
      businessId,
      roleId,
      x: 55 + b * 600 + (r % 3) * 165,
      y: 160 + Math.floor(r / 3) * 190,
      width: 150,
      height: 162,
    })),
  );
}
export function fitScene(
  width: number,
  height: number,
  bounds: { x: number; y: number; width: number; height: number },
  zoom: number,
): ViewportTransform {
  const scale = Math.max(
    0.001,
    Math.min(width / bounds.width, height / bounds.height) * zoom,
  );
  return {
    scale,
    offsetX: (width - bounds.width * scale) / 2 - bounds.x * scale,
    offsetY: (height - bounds.height * scale) / 2 - bounds.y * scale,
  };
}
export function hitTestDesk(
  point: { x: number; y: number },
  transform: ViewportTransform,
  desks: Desk[],
): AgentSelection | null {
  const x = (point.x - transform.offsetX) / transform.scale,
    y = (point.y - transform.offsetY) / transform.scale;
  const d = desks.find(
    (d) => x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height,
  );
  return d ? { businessId: d.businessId, roleId: d.roleId } : null;
}

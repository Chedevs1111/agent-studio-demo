/** One pointer owns a drag. Multi-touch suppresses selection until every finger lifts. */
export function createOfficeGesture() {
  const pointers = new Set<number>();
  let primary: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    drag: boolean;
  } | null = null;
  let multiple = false;
  return {
    down(id: number, x: number, y: number) {
      pointers.add(id);
      if (pointers.size > 1) {
        multiple = true;
        return;
      }
      primary = { id, x, y, lastX: x, lastY: y, drag: false };
    },
    move(id: number, x: number, y: number) {
      if (!primary || primary.id !== id || multiple) return null;
      if (Math.hypot(x - primary.x, y - primary.y) > 6) primary.drag = true;
      const delta = primary.drag
        ? { x: x - primary.lastX, y: y - primary.lastY }
        : null;
      primary.lastX = x;
      primary.lastY = y;
      return delta;
    },
    up(id: number) {
      const selected =
        primary?.id === id && !primary.drag && !multiple && pointers.has(id);
      pointers.delete(id);
      if (primary?.id === id) primary = null;
      if (!pointers.size) {
        multiple = false;
        primary = null;
      }
      return !!selected;
    },
    cancel() {
      pointers.clear();
      primary = null;
      multiple = false;
    },
  };
}

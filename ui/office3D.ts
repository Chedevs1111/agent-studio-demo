import { createOfficeGesture } from "./officeGesture.js";
import * as T from "three";
import type { OfficeScene, DeskModel } from "./officeScene.js";
import type { AgentSelection, TeamView } from "./officeGeometry.js";
export interface OfficeController {
  update(scene: OfficeScene): void;
  setView(view: TeamView): void;
  zoomBy(delta: number): void;
  reset(): void;
  setMotion(enabled: boolean): void;
  setSelection(s: AgentSelection | null): void;
  resize(): void;
  dispose(): void;
}
const noop: OfficeController = {
  update() {},
  setView() {},
  zoomBy() {},
  reset() {},
  setMotion() {},
  setSelection() {},
  resize() {},
  dispose() {},
};
export function canvasPointer(
  x: number,
  y: number,
  r: { left: number; top: number; width: number; height: number },
) {
  if (
    !r.width ||
    !r.height ||
    x < r.left ||
    y < r.top ||
    x > r.left + r.width ||
    y > r.top + r.height
  )
    return null;
  return new T.Vector2(
    ((x - r.left) / r.width) * 2 - 1,
    (-(y - r.top) / r.height) * 2 + 1,
  );
}
export function selectionFromObject(object: T.Object3D): AgentSelection | null {
  for (let p: T.Object3D | null = object; p; p = p.parent)
    if (p.userData.selection) return p.userData.selection;
  return null;
}
const colors: Record<string, number> = {
  working: 0x258a68,
  completed: 0x6184b2,
  failed: 0xc05b55,
  interrupted: 0xc28d43,
  cancelled: 0x89919d,
  waiting: 0xc28d43,
  queued: 0xc28d43,
  available: 0xa4acb4,
};
export function mountOffice3D(
  canvas: HTMLCanvasElement,
  initial: OfficeScene,
  handlers: {
    onSelect: (s: AgentSelection) => void;
    onUnavailable: (reason: string) => void;
  },
  createRenderer?: (canvas: HTMLCanvasElement) => T.WebGLRenderer,
): OfficeController {
  let renderer: T.WebGLRenderer;
  try {
    renderer = createRenderer
      ? createRenderer(canvas)
      : new T.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          powerPreference: "low-power",
        });
  } catch {
    handlers.onUnavailable(
      "3D graphics are unavailable. Your 2D office and task controls are ready.",
    );
    return noop;
  }
  const world = new T.Scene();
  world.background = new T.Color(0xeaf0ee);
  const camera = new T.OrthographicCamera(-20, 20, 14, -14, 0.1, 180);
  const materials = new Map<string, T.MeshStandardMaterial>();
  const actors = new Map<
    string,
    {
      group: T.Group;
      arms: T.Group[];
      light: T.MeshStandardMaterial;
      screen: T.MeshStandardMaterial;
      ring: T.Mesh;
      desk: DeskModel;
    }
  >();
  let data = initial,
    frame = 0,
    stopped = false,
    motion = false,
    view: TeamView = "both",
    zoom = 1,
    panX = 0,
    panZ = 0,
    selected: AgentSelection | null = null;
  const small = () => canvas.getBoundingClientRect().width < 700;
  const material = (color: number, roughness = 0.8) => {
    const key = color + ":" + roughness;
    let m = materials.get(key);
    if (!m) {
      m = new T.MeshStandardMaterial({ color, roughness });
      materials.set(key, m);
    }
    return m;
  };
  function box(
    parent: T.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
  ) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), material(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function ball(
    parent: T.Object3D,
    r: number,
    x: number,
    y: number,
    z: number,
    color: number,
  ) {
    const m = new T.Mesh(new T.SphereGeometry(r, 10, 8), material(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  function label(
    parent: T.Object3D,
    text: string,
    x: number,
    y: number,
    z: number,
    width: number,
    color = "#344549",
    background = true,
  ) {
    if (typeof document === "undefined") return;
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 112;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (background) {
      ctx.fillStyle = "rgba(250,252,251,.94)";
      ctx.beginPath();
      ctx.roundRect(2, 6, 764, 100, 23);
      ctx.fill();
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 34px system-ui";
    ctx.fillText(text, 384, 57, 730);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(width, (width * 112) / 768, 1);
    sprite.renderOrder = 2;
    parent.add(sprite);
  }
  const hemisphere = new T.HemisphereLight(0xffffff, 0xa3b2ad, 2.4);
  world.add(hemisphere);
  const sun = new T.DirectionalLight(0xfff4df, 3.5);
  sun.position.set(-8, 23, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small() ? 512 : 1024, small() ? 512 : 1024);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.04;
  world.add(sun);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  function plant(parent: T.Object3D, x: number, z: number) {
    box(parent, 0.55, 0.5, 0.55, x, 0.25, z, 0xe5ded3);
    for (let i = 0; i < 5; i++) {
      const leaf = ball(
        parent,
        0.35,
        x + Math.sin(i * 2) * 0.22,
        0.8 + i * 0.1,
        z + Math.cos(i * 2) * 0.18,
        0x54836c,
      );
      leaf.scale.y = 1.8;
    }
  }
  box(world, 29, 0.35, 19, 0, -0.35, 1, 0xcbd7d2);
  for (let b = 0; b < 2; b++) {
    const x = b === 0 ? -7 : 7,
      accent = b === 0 ? 0x8e6f94 : 0x65869b;
    box(world, 12, 0.18, 13.5, x, -0.08, -0.2, b === 0 ? 0xe9e0e8 : 0xdfe8ee);
    box(world, 12, 2.4, 0.24, x, 1.1, -6.9, b === 0 ? 0xd7c5d9 : 0xc3d5e0);
    box(world, 0.22, 1.0, 13.5, x + (b === 0 ? -6 : 6), 0.4, -0.2, 0xc5d1d1);
    for (let i = 0; i < 3; i++) {
      box(world, 2.6, 1.35, 0.08, x - 3.4 + i * 3.4, 1.25, -6.72, 0xf8f8f3);
      box(world, 2.38, 1.14, 0.08, x - 3.4 + i * 3.4, 1.25, -6.65, 0xb7d1d3);
      box(world, 0.045, 1.14, 0.08, x - 3.4 + i * 3.4, 1.25, -6.58, 0xf8f8f3);
    }
    for (let z = -5.7; z < 6; z += 1.25)
      box(world, 11.8, 0.012, 0.02, x, 0.02, z, b === 0 ? 0xdccedc : 0xcbd9e0);
    label(
      world,
      b === 0 ? "Beleza Digital Media" : "Devsense",
      x,
      3.05,
      -5.5,
      7,
      b === 0 ? "#74527b" : "#476d85",
    );
    plant(world, x - 5, 5.2);
    plant(world, x + 5, -5.8);
    box(world, 2.6, 0.65, 1.0, x, 0.4, 5.6, accent);
    box(world, 2.6, 0.5, 0.25, x, 0.95, 5.95, accent);
  }
  // The front review area is furniture, not a fabricated extra running agent.
  box(world, 9, 0.12, 3.4, 0, -0.05, 8.4, 0xd5dfd9);
  box(world, 5.2, 0.22, 1.7, 0, 0.95, 8.0, 0x9eaf9e);
  box(world, 0.25, 0.9, 1.3, -2, 0.4, 8, 0x809080);
  box(world, 0.25, 0.9, 1.3, 2, 0.4, 8, 0x809080);
  label(world, "Manager & review", 0, 2.2, 8.3, 5.2, "#4d655a");
  plant(world, -5.5, 8.6);
  plant(world, 5.5, 8.6);
  function buildActor(d: DeskModel, index: number) {
    const g = new T.Group();
    g.position.fromArray(d.position);
    g.userData.selection = { businessId: d.businessId, roleId: d.roleId };
    world.add(g);
    const accent = d.businessId === "beleza" ? 0x8e6f94 : 0x65869b,
      skin = [0xc88e65, 0xdcb698, 0x9f6e51, 0xe5be9f][index % 4],
      hair = [0x3f3633, 0x725143, 0x252d35][index % 3];
    box(g, 1.85, 0.16, 1.12, 0, 0.95, 0, 0xeee7da);
    for (const x of [-0.7, 0.7]) box(g, 0.09, 0.88, 0.76, x, 0.45, 0, 0x8d9996);
    box(g, 0.73, 0.48, 0.09, 0, 1.4, -0.22, 0x35474b);
    const screenMat = new T.MeshStandardMaterial({
      color: 0x8bbcc3,
      emissive: 0x456b6d,
      emissiveIntensity: 0.2,
    });
    const screen = new T.Mesh(new T.PlaneGeometry(0.63, 0.36), screenMat);
    screen.position.set(0, 1.4, -0.165);
    g.add(screen);
    box(g, 0.08, 0.22, 0.08, 0, 1.07, -0.22, 0x405456);
    box(g, 0.68, 0.025, 0.25, 0, 1.05, 0.3, 0xa8b8b4);
    box(g, 0.6, 0.13, 0.55, 0, 0.58, 0.9, accent);
    box(g, 0.6, 0.58, 0.13, 0, 0.92, 1.14, accent);
    box(g, 0.1, 0.5, 0.1, 0, 0.25, 0.9, 0x667c79);
    box(g, 0.47, 0.54, 0.35, 0, 1.1, 0.72, accent);
    box(g, 0.16, 0.4, 0.17, -0.14, 0.62, 0.62, 0x455663);
    box(g, 0.16, 0.4, 0.17, 0.14, 0.62, 0.62, 0x455663);
    ball(g, 0.255, 0, 1.66, 0.73, skin);
    box(g, 0.43, 0.16, 0.4, 0, 1.85, 0.71, hair);
    ball(g, 0.035, -0.095, 1.7, 0.95, 0x2c363b);
    ball(g, 0.035, 0.095, 1.7, 0.95, 0x2c363b);
    const arms: T.Group[] = [];
    for (const x of [-0.31, 0.31]) {
      const a = new T.Group();
      a.position.set(x, 1.36, 0.7);
      g.add(a);
      box(a, 0.14, 0.3, 0.18, 0, -0.14, 0, accent);
      ball(a, 0.085, 0, -0.33, 0, skin);
      arms.push(a);
    }
    const lampMat = new T.MeshStandardMaterial({
      color: colors[d.status],
      emissive: colors[d.status],
      emissiveIntensity: 0.4,
    });
    const lamp = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), lampMat);
    lamp.position.set(0.78, 1.09, 0.35);
    g.add(lamp);
    const ring = new T.Mesh(
      new T.RingGeometry(0.82, 0.9, 32),
      new T.MeshBasicMaterial({ color: accent, side: T.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.035, 0.3);
    ring.visible = false;
    g.add(ring);
    const short: Record<string, string> = {
      marketing: "Marketing",
      prospects: "Leads",
      email: "Email",
      design: "Design",
      social: "Social",
      analytics: "Analytics",
      crm: "CRM",
      quality: "Quality",
      followup: "Follow-ups",
      proposals: "Proposals",
      inbox: "Inbox",
    };
    label(
      g,
      short[d.roleId] ?? d.label,
      0,
      2.25,
      0.7,
      2.05,
      d.businessId === "beleza" ? "#74527b" : "#476d85",
    );
    actors.set(d.key, {
      group: g,
      arms,
      light: lampMat,
      screen: screenMat,
      ring,
      desk: d,
    });
  }
  initial.desks.forEach(buildActor);
  function cameraView() {
    const r = canvas.getBoundingClientRect(),
      aspect = Math.max(0.1, r.width / Math.max(1, r.height));
    const span = Math.max(
      view === "both" ? 12.8 : 8.5,
      (view === "both" ? 17.4 : 9.6) / aspect,
    );
    const x = (view === "beleza" ? -7 : view === "devsense" ? 7 : 0) + panX,
      z = 1 + panZ;
    camera.left = -span * aspect;
    camera.right = span * aspect;
    camera.top = span;
    camera.bottom = -span;
    camera.zoom = zoom;
    camera.position.set(x + 24, 29, z + 30);
    camera.lookAt(x, 0, z);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  function schedule() {
    if (!stopped && !frame) frame = requestAnimationFrame(draw);
  }
  function draw(time: number) {
    frame = 0;
    if (stopped) return;
    const animate =
      motion && (typeof document === "undefined" || !document.hidden);
    let working = false;
    for (const [i, a] of [...actors.values()].entries()) {
      working ||= a.desk.status === "working";
      a.arms.forEach((arm, n) => {
        arm.rotation.x =
          animate && a.desk.status === "working"
            ? -0.9 + Math.sin(time * 0.009 + i + n * 2) * 0.15
            : 0;
      });
    }
    renderer.render(world, camera);
    if (animate && working) schedule();
  }
  function resize() {
    if (stopped) return;
    const r = canvas.getBoundingClientRect();
    renderer.setPixelRatio(
      Math.min(
        typeof devicePixelRatio === "number" ? devicePixelRatio : 1,
        small() ? 1.5 : 2,
      ),
    );
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    cameraView();
    schedule();
  }
  const gesture = createOfficeGesture();
  const pointerDown = (e: PointerEvent) => {
    gesture.down(e.pointerId, e.clientX, e.clientY);
    canvas.setPointerCapture?.(e.pointerId);
  };
  const pointerMove = (e: PointerEvent) => {
    const delta = gesture.move(e.pointerId, e.clientX, e.clientY);
    if (!delta) return;
    panX = T.MathUtils.clamp(panX - (delta.x * 0.025) / zoom, -8, 8);
    panZ = T.MathUtils.clamp(panZ - (delta.y * 0.025) / zoom, -7, 7);
    cameraView();
    schedule();
  };
  const pointerUp = (e: PointerEvent) => {
    if (!gesture.up(e.pointerId)) return;
    const point = canvasPointer(
      e.clientX,
      e.clientY,
      canvas.getBoundingClientRect(),
    );
    if (!point) return;
    const ray = new T.Raycaster();
    ray.setFromCamera(point, camera);
    for (const hit of ray.intersectObjects(
      [...actors.values()].map((a) => a.group),
      true,
    )) {
      const selection = selectionFromObject(hit.object);
      if (selection) {
        handlers.onSelect(selection);
        break;
      }
    }
  };
  const pointerCancel = () => {
    gesture.cancel();
  };
  function dispose() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("pointerdown", pointerDown);
    canvas.removeEventListener("pointermove", pointerMove);
    canvas.removeEventListener("pointerup", pointerUp);
    canvas.removeEventListener("pointercancel", pointerCancel);
    const geometries = new Set<T.BufferGeometry>(),
      mats = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    world.traverse((o) => {
      const m = o as T.Mesh;
      if (m.geometry) geometries.add(m.geometry);
      if (m.material)
        for (const mat of Array.isArray(m.material)
          ? m.material
          : [m.material]) {
          mats.add(mat);
          const texture = (mat as T.SpriteMaterial).map;
          if (texture) textures.add(texture);
        }
    });
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    mats.forEach((m) => m.dispose());
    renderer.dispose();
  }
  function lost(e: Event) {
    e.preventDefault();
    if (stopped) return;
    dispose();
    handlers.onUnavailable(
      "3D graphics paused after a graphics reset. Continue in the 2D office.",
    );
  }
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerCancel);
  resize();
  return {
    update(scene) {
      if (stopped) return;
      data = scene;
      for (const d of data.desks) {
        const a = actors.get(d.key);
        if (a) {
          a.desk = d;
          a.light.color.setHex(colors[d.status]);
          a.light.emissive.setHex(colors[d.status]);
          a.screen.emissiveIntensity = d.status === "working" ? 0.6 : 0.15;
        }
      }
      schedule();
    },
    setView(v) {
      view = v;
      panX = panZ = 0;
      zoom = 1;
      cameraView();
      schedule();
    },
    zoomBy(delta) {
      zoom = T.MathUtils.clamp(zoom + delta, 0.65, 2.5);
      cameraView();
      schedule();
    },
    reset() {
      zoom = 1;
      panX = panZ = 0;
      cameraView();
      schedule();
    },
    setMotion(enabled) {
      motion = enabled;
      schedule();
    },
    setSelection(s) {
      selected = s;
      for (const a of actors.values())
        a.ring.visible =
          !!selected &&
          a.desk.businessId === selected.businessId &&
          a.desk.roleId === selected.roleId;
      schedule();
    },
    resize,
    dispose,
  };
}

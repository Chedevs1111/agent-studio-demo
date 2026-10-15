import { build } from "esbuild";
import { mkdir, writeFile, readFile } from "node:fs/promises";
await mkdir("dist/assets", { recursive: true });
const result = await build({
  entryPoints: ["ui/main.tsx"],
  bundle: true,
  minify: true,
  outdir: "dist",
  entryNames: "assets/demo-[hash]",
  format: "esm",
  metafile: true,
});
const entry = Object.entries(result.metafile.outputs).find(
  ([, m]) => m.entryPoint === "ui/main.tsx",
);
if (!entry) throw Error("Missing demo entry");
const relative = (p) => "./" + p.replace(/^dist\//, "");
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; upgrade-insecure-requests";
await writeFile(
  "dist/assets/icon.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#193a35"/><text x="32" y="39" text-anchor="middle" font-size="23" font-family="Georgia" fill="#dce8ba">B/D</text></svg>',
);
await writeFile("dist/.nojekyll", "");
await writeFile(
  "dist/index.html",
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="theme-color" content="#193a35"><meta name="description" content="Explore the original 3D Agent Studio for Beleza Digital Media and Devsense. Public demo with sample tasks and simulated agent handoffs."><title>Agent Studio · Public demo</title><link rel="icon" href="./assets/icon.svg"><link rel="stylesheet" href="${relative(entry[1].cssBundle)}"></head><body><div id="root"></div><script type="module" src="${relative(entry[0])}"></script></body></html>`,
);

await writeFile("dist/assets/vendor-notices.txt", (await Promise.all(["react", "react-dom", "three"].map(async name => name + "\n" + await readFile(`node_modules/${name}/LICENSE`, "utf8")))).join("\n\n"));

# Agent Studio — public demo

An original interactive 3D office for **Beleza Digital Media** and **Devsense**.

Live demo: https://chedevs1111.github.io/agent-studio-demo/

Explore 22 agent roles, switch companies, try an example brief and watch simulated marketing-to-research/design handoffs. Sample outputs appear after approximately ten seconds per simulated task. Use **Reset demo** to replay the sequence.

## Privacy and scope

This repository is a deliberately separate, public demonstration. It contains synthetic sample records only. It has no operational backend, Codex connection, access keys, real client records, mailbox access or social account access. It cannot send messages, publish posts or start the owner's real agents.

Visitor text exists only in the current browser tab's memory. Refreshing or resetting clears it. There is no analytics, telemetry, API fetch or browser storage. The static page's Content Security Policy sets `connect-src 'none'`.

The owner's actual operational Studio remains private and is not deployed from this repository.

## Run and update

Node.js 22.22.3 or newer supported version is required.

```sh
npm ci --ignore-scripts
npm test
npm run build
```

Serve `dist/` with any static server. Relative asset paths support a GitHub Pages project subdirectory. Pushing to `main` runs the pinned GitHub Actions workflow, tests and builds the demo, and deploys it to GitHub Pages. Hosting this static demo does not require the owner's Mac to be online.

The browser provides the original Three.js geometry and a list fallback if WebGL is unavailable. No Agents Office source, artwork or branding is included. React and Three.js retain their respective upstream license notices.

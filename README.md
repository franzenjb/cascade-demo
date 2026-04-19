# Project Cascade

A working demo of conversational, anticipatory emergency mapping — the companion to the strategic white paper *["Before You Even Ask"](https://jbf.com/before-you-even-ask)*.

When a tornado warning fires over fictional Cascade County, the system generates a leadership-ready impact map and narrative before anyone opens the app.

## Getting Started

```bash
git clone <repo-url>
cd cascade-demo
npm install
cp .env.example .env.local  # then fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Full Build Guide

See **[BUILD.md](./BUILD.md)** for the complete build paper: architecture, week-by-week plan, synthetic data design, Claude system prompt, tool-calling architecture, deployment, and launch checklist.

## Tech Stack

- **Next.js 14+** (App Router, TypeScript)
- **ArcGIS Maps SDK for JavaScript** (`@arcgis/core`)
- **Claude API** (Anthropic — `claude-sonnet-4-6`)
- **Vercel** (hosting + serverless API routes)
- **ArcGIS Online** (`arc-nhq-gis` org, 10 `DEMO_Cascade_*` layers)
- **Tailwind CSS** + Dragon design tokens

## Project Status

Under active development. Not yet public.

Built by Jeff Franzen (Dragon), American Red Cross GIS Developer.

## License

Proprietary — internal American Red Cross demonstration project. Not licensed for redistribution.

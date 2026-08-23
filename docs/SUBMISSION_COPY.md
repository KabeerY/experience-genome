# Submission copy

## Project title

EXPERIENCE//COMPILER

## One-line description

Turn observed web experience plus human judgment into portable design rules for any coding AI—without cloning references.

## Short description

Most design tools stop at screenshots or DOM structure. Experience Compiler uses a custom Bright Data Scraper Studio collector to preserve ordered states, triggering actions and structured evidence. A human explicitly marks what they prefer or reject. The system compiles that evidence and judgment into an Experience Genome, synthesizes an original Project Genome, verifies provenance, and downloads a portable Experience Pack for Codex, Claude, Gemini, Cursor and Copilot.

## What it does

- Captures public interactive references as structured state/action/state traces, including a persisted real-web Linear run.
- Separates observed, inferred, user-specified and unresolved claims.
- Stores human taste independently as preferred, rejected, neutral or unreviewed.
- Lets every Genome Rule be inspected back to evidence and forward to a Project Rule.
- Synthesizes inherited, mutated, rejected and invented rules with anti-copy constraints.
- Compiles a real ZIP artifact with JSON, evidence, design specifications and agent adapters.
- Demonstrates controlled schema drift and Bright Data self-healing on the same collector ID.

## How Bright Data is used

Bright Data is the grounding layer. Two custom Scraper Studio collectors produced a real public Linear capture and the separate controlled drift artifacts. The baseline, broken, heal, recovery and real-web outputs are versioned in `evidence/brightdata/`, including stable `c_*` identities. The deployed public UI never exposes an unrestricted live endpoint; it replays verified results to preserve credits and prevent abuse. Seven of 5,000 record credits were used in total; a public judge view uses zero.

## Architecture

`Bright Data collector → structured records → Experience Trace → Experience Genome + human judgment → Project Genome → provenance verification → Experience Pack`

The system is a deterministic compiler pipeline rather than a multi-agent swarm: Ground → Abstract → Judge → Synthesize → Verify → Compile.

## What we are proud of

The key primitive is inspectability. A judge can click one rule and see exactly what happened, what the system inferred, what the human preferred, how the principle changed during synthesis, and where it appears in final coding-agent context. The product also states what it failed to understand instead of manufacturing confidence.

## AI disclosure

OpenAI Codex assisted implementation, testing, visual QA and repository maintenance. OpenAI image generation created the original archive concept art. ChatGPT helped challenge product scope and narrative. The public synthesis artifact is a deterministic replay; live model generation uses a server-only OpenAI-compatible provider boundary when credentials are configured.

## Links

- Live: https://experience-genome.vercel.app
- Source: https://github.com/KabeerY/experience-genome
- Genome Lens: https://experience-genome.vercel.app/studio
- Drift Lab: https://experience-genome.vercel.app/lab/drift

# Submission copy

## Project title

EXPERIENCE//COMPILER

## One-line description

Turn live web experience plus human judgment into portable design rules for any coding AI—without cloning references.

## Short description

Experience Compiler visits any public interactive website, captures an ordered browser journey with Bright Data, and sends a compact rendered contact sheet plus measured evidence to a Fireworks multimodal model. The machine separates observation, interpretation, and unknowns; the human explicitly decides what mattered. A second bounded model role synthesizes those judged principles into an original Project Genome, while deterministic verification enforces provenance, preference lanes, uncertainty, and anti-copy constraints. The result downloads as a portable Experience Pack for Codex, Claude, Gemini, Cursor, and Copilot.

## What it does

- Accepts an arbitrary public URL instead of selecting a prepared site.
- Uses a custom Bright Data collector for ordered state/action/state evidence.
- Uses Bright Data Scraping Browser for real rendered frames and browser measurements.
- Uses Fireworks-hosted Kimi K2.6 to interpret rendered evidence and synthesize a Project Genome.
- Separates observed, inferred, human-specified, and unresolved claims.
- Stores human preference independently as Keep or Leave behind, with an optional explanation.
- Synthesizes inherited, mutated, rejected, and invented rules.
- Rejects invalid source citations and crossed judgment lanes with a deterministic provenance verifier.
- Downloads a real ZIP containing evidence, screenshots, project rules, unknowns, anti-copy constraints, and coding-agent adapters.
- Persists the workshop locally without requiring login or a database.
- Demonstrates controlled same-collector recovery separately in Drift Lab.

## Why Bright Data is essential

Bright Data is the product's perception layer. Scraper Studio establishes the bounded ordered journey, while Scraping Browser establishes what the page actually rendered at sampled scroll positions. Without both, the system would fall back to a screenshot describer or DOM summarizer and could not expose an inspectable experience trace.

If the rendered layer fails, the interface labels the run as structured-only and the model does not receive or claim visual input. A failed live collection never silently becomes prepared replay data.

## Architecture

`public URL → Bright Data structured journey + rendered frames → Evidence Interpreter → human taste gate → Genome Synthesizer → deterministic provenance verifier → Project Genome → Experience Pack`

This is a bounded compiler pipeline, not an agent swarm. The two model roles have distinct contracts; collection, human judgment, provenance verification, persistence, and artifact generation remain deterministic.

## What we are proud of

The key primitive is an inspectable chain:

`real experience → evidence → inference → human judgment → reusable rule → project transformation → agent context`

A judge can see the original rendered moments, what the model directly observed, what it only inferred, what remained unknown, what the human selected, and how that decision entered the final Project Genome.

## AI disclosure

OpenAI Codex assisted implementation, research, testing, visual QA, deployment, and repository maintenance. ChatGPT helped critique product scope and narrative. OpenAI image generation produced an original landscape plate for the landing story. Fireworks-hosted Kimi K2.6 performs live multimodal interpretation and synthesis.

## Links

- Live: https://experience-genome.vercel.app
- Source: https://github.com/KabeerY/experience-genome
- Live compiler: https://experience-genome.vercel.app/#capture-lab
- Drift Lab: https://experience-genome.vercel.app/lab/drift

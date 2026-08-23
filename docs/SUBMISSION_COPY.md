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

## Form answer 1 — What does your project do?

Experience Compiler turns interactive websites a person loves into portable, evidence-backed design rules for coding agents. A user pastes any public URL; the system records an ordered browser journey, shows what visibly changed, separates observation from inference and unknowns, and asks the user to mark the proposed principle Keep or Leave behind and explain why. It then synthesizes those judged principles into an original Project Genome and downloadable Experience Pack for Codex, Claude, Gemini, Cursor, and Copilot.

The problem is that screenshots and ordinary scrapers capture pixels or structure, but miss the temporal experience around them: what appears after scrolling, what remains fixed, and what the human actually liked. The product is for designers, creative developers, and teams that want AI-generated interfaces to learn from experiential principles without copying source assets, wording, or composition.

## Form answer 2 — How did you use Scraper Studio in your project?

Scraper Studio is the structured perception layer of every live run. We built a custom collector that accepts an arbitrary public URL and returns an ordered state/action/state journey: sequence, stage, prior action, visible heading, text excerpt, section identity, and canonical URL. We combine that semantic trace with a Bright Data Scraping Browser pass that settles at five distributed scroll positions and records rendered screenshots plus browser measurements such as visible headings, fixed and sticky elements, running animations, and transforms.

The two layers are intentionally complementary. Scraper Studio establishes ordered, reusable semantic evidence; Scraping Browser establishes what was actually rendered. The Fireworks multimodal interpreter receives both, while deterministic provenance checks keep observed, inferred, and unresolved claims separate. We also built a controlled Drift Lab where a fixture representation changes, the collector breaks, and Scraper Studio repairs the same collector ID until the original output contract is recovered.

## Form answer 3 — Most frustrating issue with Scraper Studio or the CLI

The most frustrating part was that “the run completed” did not always mean “the evidence is usable.” During collector creation and repair, a high-level status could hide whether the failure came from page rendering, a generated selector, schema mismatch, or a preview payload. On complex interactive pages, the structured collector and rendered Browser pass also needed careful sequencing so one Bright Data workload released before the next began.

We would have benefited from more explicit stage-level errors, a generated-code and schema diff, and a clear distinction between transport success, extraction success, and contract validation. We eventually added our own Zod boundary, saved raw failure artifacts, redacted provider errors, and refused to silently substitute stored data when a live run failed.

## Form answer 4 — Where did you get stuck longest, and what got you unstuck?

The longest block was deterministic recovery after representation drift. Our baseline fixture used one DOM representation; the shifted version caused the existing collector to return an empty `experience_states` array. The first repair still returned nothing. A more precise repair recovered all three rows, but every sequence value became zero because the visible number was split across text nodes.

What got us unstuck was treating each failed output as evidence instead of repeatedly asking for a broad AI repair. We saved the broken payload, inspected the rendered public structure, specified the exact ordered-list selector and field mapping, reran the same collector, and then made a second narrow fix that derived sequence from iteration order. The final ledger proves baseline success, deliberate breakage, and recovery of the same schema with the same collector ID.

## Form answer 5 — Overall developer experience and feedback

Overall, Scraper Studio was powerful because it compressed the path from a natural-language extraction goal to a runnable, hosted collector with preview and repair tooling. Keeping the same collector ID through a real representation change was especially valuable, and the CLI made the final capture loop scriptable enough to integrate into a deployed product.

The main improvement I would ask for is observability: show the exact failing stage, selector coverage, output-schema validation, generated-code diff, and expected credit impact before a run. A deterministic dry-run mode and clearer guidance on coordinating collector and Browser API workloads would also help. Even with those rough edges, Bright Data became essential rather than decorative in our architecture: without it, Experience Compiler would collapse into a screenshot describer instead of an inspectable system grounded in live web evidence.

# EXPERIENCE//COMPILER

![Experience Compiler cinematic landing](public/readme/hero.png)

**Observe the experience. Supply the judgment. Compile what mattered.**

[Live product](https://experience-genome.vercel.app) · [Genome Lens](https://experience-genome.vercel.app/studio) · [Drift Lab](https://experience-genome.vercel.app/lab/drift) · [Controlled fixture](https://experience-genome.vercel.app/fixture?representation=baseline)

Experience Compiler turns interactive web evidence plus human taste into portable design rules for any coding AI—without cloning the references.

```text
real experience → evidence → inference → human judgment
                → reusable rule → multi-reference synthesis → agent context
```

## The problem

A screenshot captures appearance. A DOM scrape captures symbols and structure. Neither reliably captures the ordered experience around them: what changed after a scroll, what waited before appearing, or which part a particular human actually loved.

Experience Compiler preserves three different kinds of truth:

| Truth | Question | Source |
| --- | --- | --- |
| Descriptive | What happened? | state/action/state evidence |
| Causal | What changed after an action? | observed deltas, with stronger claims only when grounded |
| Normative | Did this matter? Was it liked? | explicit human judgment |

That is why `epistemicBasis` and `humanJudgment` are separate fields. A rule can be both `observed` **and** `preferred`.

## What a judge can do

1. Scroll through a light parallax expedition where Akshar reads structure and Gati follows change.
2. Watch the manga-style problem story resolve into a state/action/state evidence path and a branching Experience Genome.
3. Enter the embedded **Guided Quest** without leaving the page.
4. Switch from the controlled fixture to a real persisted Linear capture.
5. Mark the real observation **Keep** and watch `R05` enter the multi-reference Project Genome without rewriting evidence.
6. Compile a real `experience-pack.zip` containing canonical JSON, evidence, anti-copy constraints and adapters for Codex, Claude, Gemini, Cursor and Copilot.
7. Open the full **Genome Lens** for deeper provenance inspection or **Drift Lab** for the deterministic same-Collector-ID healing proof.

![Genome Lens evidence workbench](public/readme/genome-lens.png)

## Why Bright Data is central

Bright Data is the perception layer—not a decorative API call.

- A **custom Scraper Studio collector** produces structured records from public web pages.
- Every run keeps its `c_*` collector identity and response/snapshot identity.
- Collected records are normalized into an **Experience Trace**: ordered states, triggering actions and observed deltas.
- Verified captures are persisted as replay artifacts so every public demo view does not consume another credit.
- A separate public fixture changes its representation while retaining the same visible meaning and output contract. That creates a controlled break → heal → recover experiment.

### Credit discipline

The public deployment never exposes an unrestricted collection endpoint. It runs in **Verified Replay** mode. Live collection is an operator-only submission/video step. This prevents abuse and preserves the 5,000-credit grant for judging.

The completed proof used seven one-record payloads total: six for the transparent controlled healing experiment and one for the real external reference. That is **7 / 5,000 credits (0.14%)**, leaving 4,993 for judge follow-up and testing. No broad crawling, public live endpoint, or automatic retry loop exists.

### Bright Data evidence ledger

| Artifact | Status | Evidence |
| --- | --- | --- |
| Initial observer attempt | Failed before template generation; no records | [`evidence/brightdata/observer-create.json`](evidence/brightdata/observer-create.json) |
| Drift collector | Verified custom collector | `c_mt62ojenhz0udx9w5` · [`drift-observer-create.json`](evidence/brightdata/drift-observer-create.json) |
| Baseline job | Verified | 1 payload / 3 ordered states · [`drift-baseline-run.json`](evidence/brightdata/drift-baseline-run.json) |
| Broken job | Verified controlled failure | same schema, empty `experience_states` · [`drift-broken-run.json`](evidence/brightdata/drift-broken-run.json) |
| Same-ID heal | Verified | approval + save completed without changing `c_mt62ojenhz0udx9w5` · [`drift-heal-sequence.json`](evidence/brightdata/drift-heal-sequence.json) |
| Recovery job | Verified | exact sequences 1/2/3 and complete contract · [`drift-sequence-recovery-run.json`](evidence/brightdata/drift-sequence-recovery-run.json) |
| Real-web collector | Verified custom collector | `c_mt63a8sa1etvcxxbei` · [`real-web-observer-create.json`](evidence/brightdata/real-web-observer-create.json) |
| Linear public-web capture | Verified, intentionally sparse | 1 payload / 3 ordered regions · [`real-web-run.json`](evidence/brightdata/real-web-run.json) |

The UI and this table remain explicit about unknown or sparse evidence. A failed attempt is kept in history rather than erased. The controlled experiment used six one-record runs—including three visible intermediate failures while refining the heal—and the real-web proof used one. See [`drift-ledger.json`](evidence/brightdata/drift-ledger.json) for the controlled audit trail.

![Controlled Drift Lab](public/readme/drift-lab.png)

## Architecture

```mermaid
flowchart LR
    A[Public interactive reference] --> B[Bright Data custom collector]
    B --> C[Structured records + collector / snapshot evidence]
    C --> D[Grounding + Experience Trace]
    D --> E[Experience Genome IR]
    H[Human Keep / Reject / Note] --> E
    E --> F[Project Genome synthesis]
    F --> G[Portable Experience Pack]
    G --> I[Codex / Claude / Gemini / Cursor / Copilot]
```

The build is deliberately a compiler pipeline, not an agent swarm:

```text
Ground → Abstract → Judge → Synthesize → Verify → Compile
```

- **Next.js 16 / React 19** on Vercel
- **React Three Fiber / Three.js** plus layered CSS scenery for the scroll-linked landscape and distinct Akshar/Gati motion
- **Zod** for the canonical intermediate representation and provenance constraints
- **JSZip** for client-side portable pack compilation
- **Bright Data Scraper Studio** for public-web grounding and self-healing proof
- **OpenAI-compatible model provider boundary** for OX Alpha today and Fireworks/other providers later
- No authentication and no database in the hackathon path; replay JSON is versioned, judgments stay local, and the artifact downloads as a ZIP

## Intermediate representation

The central object is not a prompt. It is a verifiable Experience Genome.

```ts
type GenomeClaim = {
  epistemicBasis: "observed" | "inferred" | "user-specified" | "unresolved";
  humanJudgment: "preferred" | "rejected" | "neutral" | "unreviewed";
  evidenceRefs: string[];
  statement: string;
  interpretation?: string;
  humanNote?: string;
};
```

The verifier rejects an `observed` claim without evidence, unknown evidence references, or a non-invented Project Rule without a source claim.

## Experience Pack

```text
experience-pack/
├── manifest.json
├── genome/
│   ├── EXPERIENCE_GENOME.json
│   ├── PROJECT_GENOME.json
│   ├── EVIDENCE.json
│   └── TRACES.json
├── design/
│   ├── FORM.md
│   ├── MOTION.md
│   ├── SCENE.md
│   ├── AFFECT.md
│   └── TOKENS.json
├── intent/
│   ├── PROJECT_BRIEF.md
│   └── ANTI_COPY.md
└── agents/
    ├── AGENTS.md
    ├── CLAUDE.md
    ├── GEMINI.md
    ├── cursor.mdc
    └── copilot-instructions.md
```

## Run locally

```bash
corepack enable
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

Quality gates:

```bash
pnpm lint
pnpm build
```

Submission helpers: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) · [`docs/SUBMISSION_COPY.md`](docs/SUBMISSION_COPY.md)

## Environment contract

The checked-in public demo does not require secrets. Operator-only live modes use server-side variables:

```bash
BRIGHT_DATA_API_TOKEN=
MODEL_PROVIDER=openrouter
MODEL_BASE_URL=https://openrouter.ai/api/v1
MODEL_API_KEY=
MODEL_ID=stealth/ox-alpha
```

Secrets never enter client bundles. A provider capability check is required before switching models; OpenAI-compatible transport does not guarantee equivalent structured-output behavior.

## AI use disclosure

- OpenAI Codex was used for implementation, visual QA, testing and repository maintenance.
- OpenAI image generation produced the original light monsoon-landscape plate used behind the code-native parallax story; it does not copy a supplied site or copyrighted character.
- ChatGPT was used as a product-thinking collaborator during scope correction and narrative development.
- The committed synthesis artifact is a deterministic verified replay. Live model generation is kept behind the provider boundary so the public demo remains stable and does not expose keys.

## Truth and anti-copy contract

- Observations, inferences, user statements and unresolved dimensions are visibly labeled.
- Action-conditioned change is not automatically promoted to universal causation.
- Project synthesis stores **inherited / mutated / rejected / invented** provenance.
- Outputs explicitly prohibit copying source geometry, timing values, copy, camera paths, layout chrome or brand language.
- Only public, non-login, non-personal data is in scope.

---

> **The machine records what happened. The human tells it what mattered.**

"use client";

import {
  ArrowDown,
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  CircleDashed,
  Code2,
  Compass,
  Download,
  Eye,
  FileCode2,
  Fingerprint,
  GitBranch,
  Heart,
  Play,
  RefreshCw,
  ScanLine,
  Sparkles,
  TreePine,
  TriangleAlert,
  Wind,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  demoGenome,
  demoGenomes,
  demoProjectGenome,
  demoTrace,
  demoTraces,
  realWebGenome,
  realWebProjectRule,
  realWebTrace,
} from "@/lib/demo-data";
import { downloadExperiencePack } from "@/lib/compiler/experience-pack";
import type { ExperienceTrace, GenomeClaim, ProjectRule } from "@/lib/genome/schema";
import { verifyProvenance } from "@/lib/genome/verify";

import styles from "./studio-app.module.css";

type WorkspaceTab = "observe" | "synthesize" | "compile";
type ReferenceKey = "fixture" | "real-web";

const statusLabel = {
  observed: "OBSERVED",
  inferred: "INFERRED",
  "user-specified": "USER-SPECIFIED",
  unresolved: "UNRESOLVED",
} as const;

const transformationCopy = {
  inherited: "Inherited",
  mutated: "Mutated",
  rejected: "Rejected",
  invented: "Invented",
} as const;

const packTree = [
  ["manifest.json", "identity + verification"],
  ["genome/", "canonical intermediate representation"],
  ["  EXPERIENCE_GENOME.json", "source rules"],
  ["  PROJECT_GENOME.json", "synthesized rules"],
  ["  EVIDENCE.json", "grounding objects"],
  ["  TRACES.json", "state/action timelines"],
  ["design/", "human-readable specifications"],
  ["intent/", "brief + anti-copy contract"],
  ["agents/", "portable adapters"],
  ["  AGENTS.md", "Codex"],
  ["  CLAUDE.md", "Claude"],
  ["  GEMINI.md", "Gemini"],
  ["  cursor.mdc", "Cursor"],
  ["  copilot-instructions.md", "Copilot"],
] as const;

function BasisBadge({ claim }: { claim: GenomeClaim }) {
  return (
    <div className={styles.badgeRow}>
      <span className={`${styles.basisBadge} ${styles[claim.epistemicBasis.replace("-", "")]}`}>
        {statusLabel[claim.epistemicBasis]}
      </span>
      {claim.humanJudgment === "preferred" && (
        <span className={styles.preferredBadge}>
          <Heart size={11} fill="currentColor" /> PREFERRED
        </span>
      )}
      {claim.humanJudgment === "rejected" && (
        <span className={styles.rejectedBadge}>
          <X size={11} /> REJECTED
        </span>
      )}
    </div>
  );
}

function TraceTimeline({ trace }: { trace: ExperienceTrace }) {
  return (
    <div className={styles.timeline}>
      {trace.states.map((state, index) => {
        const action = trace.actions[index];
        return (
          <div className={styles.timelineSegment} key={state.id}>
            <article className={styles.stateCard}>
              <div className={styles.stateTopline}>
                <span>{String(state.elapsedMs / 1000).padStart(4, "0")}s</span>
                <span>{state.id}</span>
              </div>
              <div className={styles.stateVisual} data-state={index + 1}>
                <div className={styles.visualOrbit} />
                <div className={styles.visualCore} />
                <div className={styles.visualLabel}>{state.label}</div>
              </div>
              <h3>{state.heading}</h3>
              <div className={styles.signalGrid}>
                {state.signals.map((signal) => (
                  <div key={signal.key}>
                    <span>{signal.key.replaceAll("_", " ")}</span>
                    <strong>{signal.value}</strong>
                  </div>
                ))}
              </div>
            </article>
            {action && (
              <div className={styles.actionBridge}>
                <div className={styles.actionLine} />
                <span>
                  {action.type === "scroll" ? <ArrowDown size={13} /> : <CircleDashed size={13} />}
                  {action.label}
                </span>
                <small>{action.durationMs}ms · {action.actor}</small>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClaimInspector({
  claim,
  onJudge,
}: {
  claim: GenomeClaim;
  onJudge: (judgment: GenomeClaim["humanJudgment"]) => void;
}) {
  const evidence = claim.evidenceRefs.join(" → ") || "human input";

  return (
    <aside className={styles.inspector}>
      <div className={styles.inspectorHeader}>
        <span>GENOME RULE / {claim.id}</span>
        <Fingerprint size={17} />
      </div>
      <BasisBadge claim={claim} />
      <h2>{claim.statement}</h2>
      {claim.interpretation && <p className={styles.interpretation}>{claim.interpretation}</p>}

      <div className={styles.provenanceBlock}>
        <span>Evidence path</span>
        <code>{evidence}</code>
      </div>

      <div className={styles.judgmentBlock}>
        <span>Human judgment</span>
        <div className={styles.judgmentButtons}>
          <button
            className={claim.humanJudgment === "preferred" ? styles.keepActive : ""}
            onClick={() => onJudge("preferred")}
            type="button"
          >
            <Heart size={14} /> Keep
          </button>
          <button
            className={claim.humanJudgment === "rejected" ? styles.rejectActive : ""}
            onClick={() => onJudge("rejected")}
            type="button"
          >
            <X size={14} /> Reject
          </button>
        </div>
        <blockquote>{claim.humanNote ?? "Awaiting your judgment."}</blockquote>
      </div>

      <div className={styles.truthNote}>
        <ScanLine size={15} />
        <p>
          The machine records what happened. <strong>You decide what mattered.</strong>
        </p>
      </div>
    </aside>
  );
}

function ProjectRuleCard({
  rule,
  active,
  onClick,
}: {
  rule: ProjectRule;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.ruleCard} ${active ? styles.ruleCardActive : ""}`}
      data-transform={rule.transformation}
      onClick={onClick}
      type="button"
    >
      <div>
        <span>{transformationCopy[rule.transformation]}</span>
        <small>{rule.id}</small>
      </div>
      <h3>{rule.title}</h3>
      <p>{rule.rule}</p>
      <ChevronRight size={17} />
    </button>
  );
}

export function StudioApp() {
  const [tab, setTab] = useState<WorkspaceTab>("observe");
  const [activeReference, setActiveReference] = useState<ReferenceKey>("fixture");
  const [claims, setClaims] = useState(demoGenomes.flatMap((genome) => genome.claims));
  const [selectedClaimId, setSelectedClaimId] = useState("C01");
  const [selectedRuleId, setSelectedRuleId] = useState("R01");
  const [compileStatus, setCompileStatus] = useState<"idle" | "working" | "done">("idle");
  const [replayToken, setReplayToken] = useState(0);

  const activeTrace = activeReference === "fixture" ? demoTrace : realWebTrace;
  const activeGenomeTemplate = activeReference === "fixture" ? demoGenome : realWebGenome;
  const activeClaims = claims.filter(
    (claim) => claim.referenceId === activeGenomeTemplate.referenceId,
  );
  const selectedClaim =
    activeClaims.find((claim) => claim.id === selectedClaimId) ?? activeClaims[0];
  const currentGenomes = useMemo(
    () =>
      demoGenomes.map((genome) => ({
        ...genome,
        claims: claims.filter((claim) => claim.referenceId === genome.referenceId),
      })),
    [claims],
  );
  const currentProject = useMemo(() => {
    const realWebSelected = claims.some(
      (claim) => claim.id === "LC01" && claim.humanJudgment === "preferred",
    );

    return {
      ...demoProjectGenome,
      rules: [
        ...demoProjectGenome.rules,
        ...(realWebSelected ? [realWebProjectRule] : []),
      ],
    };
  }, [claims]);
  const realWebJudgment = claims.find((claim) => claim.id === "LC01")?.humanJudgment;
  const selectedRule =
    currentProject.rules.find((rule) => rule.id === selectedRuleId) ?? currentProject.rules[0];
  const issues = useMemo(
    () => verifyProvenance(demoTraces, currentGenomes, currentProject),
    [currentGenomes, currentProject],
  );

  function updateJudgment(judgment: GenomeClaim["humanJudgment"]) {
    setClaims((current) =>
      current.map((claim) =>
        claim.id === selectedClaimId
          ? {
              ...claim,
              humanJudgment: judgment,
              humanNote:
                claim.humanNote ??
                (judgment === "preferred"
                  ? "Selected by the human in Genome Lens."
                  : judgment === "rejected"
                    ? "Rejected by the human in Genome Lens."
                    : undefined),
            }
          : claim,
      ),
    );
  }

  function selectReference(reference: ReferenceKey) {
    const genome = reference === "fixture" ? demoGenome : realWebGenome;
    setActiveReference(reference);
    setSelectedClaimId(genome.claims[0].id);
    setReplayToken((token) => token + 1);
  }

  async function compilePack() {
    setCompileStatus("working");
    await downloadExperiencePack({
      traces: demoTraces,
      genomes: currentGenomes,
      project: currentProject,
    });
    setCompileStatus("done");
    window.setTimeout(() => setCompileStatus("idle"), 5000);
  }

  return (
    <main className={styles.shell}>
      <div className={styles.ambient} />
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}><Compass size={18} /></span>
          <span>EXPERIENCE//COMPILER</span>
        </Link>
        <div className={styles.runIdentity}>
          <span className={styles.liveDot} />
          2 VERIFIED BRIGHT DATA REPLAYS
          <i />
          7 / 5,000 RECORDS USED
        </div>
        <nav>
          <Link href="/lab/drift"><RefreshCw size={14} /> Drift Lab</Link>
          <a href="https://github.com/KabeerY/experience-genome" rel="noreferrer" target="_blank">
            <Code2 size={14} /> Source
          </a>
        </nav>
      </header>

      <section className={styles.workspaceHeader}>
        <div>
          <span className={styles.eyebrow}>PROJECT / ORBITAL ARCHIVE</span>
          <h1>Genome Lens</h1>
          <p>Walk from captured experience to portable creative memory.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.replayButton}
            onClick={() => setReplayToken((token) => token + 1)}
            type="button"
          >
            <Play size={14} fill="currentColor" /> Replay verified capture
          </button>
          <button className={styles.compileButton} onClick={compilePack} type="button">
            {compileStatus === "working" ? (
              <><RefreshCw className={styles.spin} size={14} /> Compiling</>
            ) : compileStatus === "done" ? (
              <><Check size={14} /> Pack downloaded</>
            ) : (
              <><Download size={14} /> Compile pack</>
            )}
          </button>
        </div>
      </section>

      <section className={styles.questCoach}>
        <span className={styles.coachAvatar}><Wind size={21} /></span>
        <div>
          <small>GATI / GUIDED MODE</small>
          <strong>
            {activeReference === "fixture"
              ? "Choose Reference B to inspect a real public-web capture."
              : realWebJudgment === "unreviewed"
                ? "Open the observed rule, then Keep or Reject it. Evidence will not change."
                : tab === "observe"
                  ? "Judgment recorded. Continue to Synthesize to see whether the rule entered the Project Genome."
                  : tab === "synthesize"
                    ? "Select a Project Rule to inspect its source and anti-copy constraint."
                    : "Compile the verified genome into a portable Experience Pack."}
          </strong>
        </div>
        <div className={styles.coachSteps}>
          <span data-done>1 · Choose</span>
          <span data-done={activeReference === "real-web" || undefined}>2 · Observe</span>
          <span data-done={realWebJudgment !== "unreviewed" || undefined}>3 · Judge</span>
          <span data-done={tab === "compile" || undefined}>4 · Compile</span>
        </div>
      </section>

      <section className={styles.referenceStrip}>
        <button
          className={`${styles.referenceCard} ${activeReference === "fixture" ? styles.referenceActive : ""}`}
          onClick={() => selectReference("fixture")}
          type="button"
        >
          <div className={styles.referenceIndex}>A</div>
          <div>
            <span>CONTROLLED / BRIGHT DATA VERIFIED</span>
            <strong>Arrival Before Meaning</strong>
            <small>1 record · 3 states · 2 deltas</small>
          </div>
          <Check size={16} />
        </button>
        <button
          className={`${styles.referenceCard} ${activeReference === "real-web" ? styles.referenceActive : ""}`}
          onClick={() => selectReference("real-web")}
          type="button"
        >
          <div className={styles.referenceIndex}>B</div>
          <div>
            <span>REAL WEB / BRIGHT DATA VERIFIED</span>
            <strong>Linear public landing page</strong>
            <small>
              1 record · 3 regions · {realWebJudgment === "preferred" ? "selected for synthesis" : realWebJudgment === "rejected" ? "rejected by human" : "judgment pending"}
            </small>
          </div>
          <Check size={16} />
        </button>
        <article className={`${styles.referenceCard} ${styles.referenceBrief}`}>
          <div className={styles.referenceIndex}><Sparkles size={15} /></div>
          <div>
            <span>PROJECT BRIEF</span>
            <strong>Calm intelligence</strong>
            <small>ancient · precise · alive</small>
          </div>
        </article>
      </section>

      <div className={styles.tabs} role="tablist">
        <button aria-selected={tab === "observe"} onClick={() => setTab("observe")} role="tab" type="button">
          <Eye size={15} /> 01 Observe
        </button>
        <button aria-selected={tab === "synthesize"} onClick={() => setTab("synthesize")} role="tab" type="button">
          <GitBranch size={15} /> 02 Synthesize
        </button>
        <button aria-selected={tab === "compile"} onClick={() => setTab("compile")} role="tab" type="button">
          <Box size={15} /> 03 Compile
        </button>
      </div>

      {tab === "observe" && (
        <div className={styles.observeLayout}>
          <section className={styles.tracePanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>EXPERIENCE TRACE</span>
                <h2>{activeTrace.sourceName}</h2>
              </div>
              <div className={styles.modeBadge}>
                VERIFIED REPLAY / {activeTrace.collectorId.slice(0, 6)}…{activeTrace.collectorId.slice(-2)}
              </div>
            </div>
            <TraceTimeline key={`${activeReference}-${replayToken}`} trace={activeTrace} />
          </section>

          <section className={styles.genomePanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>GENOME CLAIMS</span>
                <h2>Evidence becomes rules</h2>
              </div>
              <small>{activeClaims.length} claims</small>
            </div>
            <div className={styles.claimList}>
              {activeClaims.map((claim) => (
                <button
                  className={claim.id === selectedClaimId ? styles.claimActive : ""}
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  type="button"
                >
                  <BasisBadge claim={claim} />
                  <strong>{claim.statement}</strong>
                  <span>{claim.dimension}</span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </section>

          <ClaimInspector claim={selectedClaim} onJudge={updateJudgment} />

          <section className={styles.coveragePanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>EXPERIENCE CONTRACT</span>
                <h2>What did we fail to understand?</h2>
              </div>
              <TriangleAlert size={18} />
            </div>
            <div className={styles.coverageRows}>
              {activeGenomeTemplate.coverage.map((item) => (
                <div key={item.dimension} data-status={item.status}>
                  <strong>{item.dimension}</strong>
                  <span>{item.status}</span>
                  <p>{item.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "synthesize" && (
        <div className={styles.synthesisLayout}>
          <section className={styles.foundryHero}>
            <div className={styles.foundryCopy}>
              <span>DREAM FOUNDRY / PROJECT GENOME</span>
              <h2>Not a generated website.<br />A system of original rules.</h2>
              <p>
                Selected source principles meet your brief, then emerge as inherited, mutated,
                rejected, or newly invented project rules.
              </p>
            </div>
            <div className={styles.genomeArtifact}>
              <div className={styles.genomeCanopy}>
                {currentProject.rules.map((rule, index) => (
                  <span data-kind={rule.transformation} key={rule.id} style={{ "--i": index } as React.CSSProperties}>{rule.id}</span>
                ))}
              </div>
              <div className={styles.genomeStem} />
              <div className={styles.genomeRoot}><TreePine size={27} /><span>PROJECT<br />GENOME</span></div>
            </div>
          </section>

          <div className={styles.ruleGrid}>
            <div className={styles.ruleList}>
              {currentProject.rules.map((rule) => (
                <ProjectRuleCard
                  active={selectedRuleId === rule.id}
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  rule={rule}
                />
              ))}
            </div>
            <aside className={styles.ruleDetail}>
              <div className={styles.ruleDetailTop} data-transform={selectedRule.transformation}>
                <span>{transformationCopy[selectedRule.transformation]}</span>
                <small>{selectedRule.id}</small>
              </div>
              <h2>{selectedRule.title}</h2>
              <p className={styles.ruleStatement}>{selectedRule.rule}</p>
              <dl>
                <div><dt>Why</dt><dd>{selectedRule.rationale}</dd></div>
                <div><dt>Build directive</dt><dd>{selectedRule.implementationDirective}</dd></div>
                <div><dt>Anti-copy</dt><dd>{selectedRule.antiCopyConstraint}</dd></div>
              </dl>
              <div className={styles.chainMap}>
                <span>PROVENANCE CHAIN</span>
                <div>
                  {selectedRule.sourceClaimRefs.length ? (
                    <>
                      <code>{selectedRule.sourceClaimRefs.some((ref) => ref.startsWith("LC")) ? "LS01–LS03" : "S01–S03"}</code><ArrowRight size={13} />
                      <code>{selectedRule.sourceClaimRefs.join(", ")}</code><ArrowRight size={13} />
                      <code>{selectedRule.id}</code><ArrowRight size={13} />
                      <code>AGENTS.md</code>
                    </>
                  ) : (
                    <><code>PROJECT BRIEF</code><ArrowRight size={13} /><code>{selectedRule.id} / INVENTED</code></>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {tab === "compile" && (
        <div className={styles.compileLayout}>
          <section className={styles.compileIntro}>
            <span>PORTABLE OUTPUT</span>
            <h2>One source of truth.<br />Every coding AI.</h2>
            <p>
              The Experience Genome is vendor-neutral. Adapters translate the same verified
              Project Genome into the context format each agent already understands.
            </p>
            <button onClick={compilePack} type="button">
              <Download size={17} /> Compile Experience Pack
            </button>
            <div className={styles.verificationSummary}>
              <Check size={16} />
              <div>
                <strong>{issues.length === 0 ? "Provenance verified" : `${issues.length} issue found`}</strong>
                <span>All observed and inherited claims resolve.</span>
              </div>
            </div>
          </section>
          <section className={styles.fileTree}>
            <div className={styles.fileTreeTop}>
              <span>experience-pack/</span>
              <small>17 files</small>
            </div>
            {packTree.map(([path, note]) => (
              <div className={path.endsWith("/") ? styles.folder : ""} key={path}>
                <span><FileCode2 size={14} />{path}</span>
                <small>{note}</small>
              </div>
            ))}
          </section>
        </div>
      )}

      <footer className={styles.statusbar}>
        <div><span className={styles.liveDot} /> VERIFIED REPLAY MODE</div>
        <div>PUBLIC VIEW COST <strong>0 LIVE RECORDS</strong></div>
        <div>SYNTHESIS <strong>{currentProject.rules.some((rule) => rule.id === "R05") ? "2 REFERENCES SELECTED" : "1 SELECTED · 1 UNREVIEWED"}</strong></div>
        <div className={issues.length ? styles.issue : styles.pass}>
          {issues.length ? <TriangleAlert size={12} /> : <Check size={12} />}
          PROVENANCE {issues.length ? "CHECK" : "PASS"}
        </div>
      </footer>
    </main>
  );
}

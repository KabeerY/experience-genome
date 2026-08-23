"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Download,
  Eye,
  FileArchive,
  Globe2,
  Heart,
  Link2,
  LoaderCircle,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  WandSparkles,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  evidenceInterpretationSchema,
  type EvidenceInterpretation,
} from "@/lib/agents/schema";
import {
  captureErrorSchema,
  liveCaptureSchema,
  type LiveCapture,
} from "@/lib/capture/public-contract";
import {
  buildSessionPackFiles,
  compileSessionGenome,
  downloadSessionPack,
  portableProjectGenomeSchema,
  type HumanDecision,
  type PortableProjectGenome,
} from "@/lib/compiler/session-pack";
import {
  clearWorkshopSession,
  loadWorkshopSession,
  saveWorkshopSession,
} from "@/lib/client/workshop-session";

import styles from "./live-workshop.module.css";

type SessionReference = {
  key: string;
  capture: LiveCapture;
  decision?: HumanDecision;
  interpretation?: EvidenceInterpretation;
  interpretationStatus: "thinking" | "ready" | "error";
  interpretationError?: string;
};

type CaptureStatus = "idle" | "capturing" | "ready" | "error";

const CAPTURE_PHASES = [
  { title: "Opening the public page", detail: "A remote browser is loading the URL you supplied." },
  { title: "Following the journey", detail: "The capture moves through the page and records ordered moments." },
  { title: "Reading visible change", detail: "Readable headings and excerpts are attached to each moment." },
  { title: "Checking the evidence", detail: "The result is normalized without inventing missing motion data." },
];

function capturedLabel(count: number) {
  if (count === 1) return "1 live reference";
  return `${count} live references`;
}

function stageLabel(order: number, total: number) {
  if (order === 1) return "Opening moment";
  if (order === total) return "Deepest captured moment";
  return "Next observed moment";
}

export function LiveWorkshop() {
  const urlInput = useRef<HTMLInputElement>(null);
  const evidenceRegion = useRef<HTMLDivElement>(null);
  const [references, setReferences] = useState<SessionReference[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("idle");
  const [capturePhase, setCapturePhase] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState("");
  const [draftRule, setDraftRule] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [draftJudgment, setDraftJudgment] = useState<HumanDecision["judgment"] | null>(null);
  const [projectTitle, setProjectTitle] = useState("My new experience");
  const [projectBrief, setProjectBrief] = useState(
    "Create an original interactive story that feels calm, tactile, and alive without reproducing any reference.",
  );
  const [desiredAffect, setDesiredAffect] = useState("wonder, clarity, anticipation");
  const [project, setProject] = useState<PortableProjectGenome | null>(null);
  const [compileStatus, setCompileStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [sessionHydrated, setSessionHydrated] = useState(false);

  const activeReference = references.find((reference) => reference.key === activeKey) ?? null;
  const activeInterpretation = activeReference?.interpretation ?? null;
  const activeFinding = activeReference?.interpretation ?? activeReference?.capture.finding ?? null;
  const decidedReferences = useMemo(
    () => references.filter((reference): reference is SessionReference & { decision: HumanDecision } => Boolean(reference.decision)),
    [references],
  );

  useEffect(() => {
    if (captureStatus !== "capturing") return;
    const interval = window.setInterval(() => {
      setCapturePhase((current) => Math.min(current + 1, CAPTURE_PHASES.length - 1));
    }, 1_150);
    return () => window.clearInterval(interval);
  }, [captureStatus]);

  useEffect(() => {
    let cancelled = false;
    void loadWorkshopSession()
      .then((result) => {
        if (cancelled || !result.success) return;
        const restored = result.data;
        const restoredReferences: SessionReference[] = restored.references.map((reference) =>
          reference.interpretationStatus === "thinking" && !reference.interpretation
            ? {
                ...reference,
                interpretationStatus: "error",
                interpretationError: "The previous agent run was interrupted by a page reload.",
              }
            : reference,
        );
        const restoredActive = restoredReferences.find((reference) => reference.key === restored.activeKey)
          ?? restoredReferences[0];
        setReferences(restoredReferences);
        setActiveKey(restoredActive?.key ?? null);
        setProjectTitle(restored.projectTitle);
        setProjectBrief(restored.projectBrief);
        setDesiredAffect(restored.desiredAffect);
        setProject(restored.project);
        setCaptureStatus(restoredReferences.length ? "ready" : "idle");
        if (restoredActive) {
          setDraftRule(restoredActive.decision?.rule ?? restoredActive.interpretation?.candidateRule ?? restoredActive.capture.finding.candidateRule);
          setDraftNote(restoredActive.decision?.note ?? "");
          setDraftJudgment(restoredActive.decision?.judgment ?? null);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSessionHydrated(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sessionHydrated) return;
    const timeout = window.setTimeout(() => {
      void saveWorkshopSession({
        version: "workshop-session@1",
        references,
        activeKey,
        projectTitle,
        projectBrief,
        desiredAffect,
        project,
        savedAt: new Date().toISOString(),
      }).catch(() => undefined);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [activeKey, desiredAffect, project, projectBrief, projectTitle, references, sessionHydrated]);

  async function requestInterpretation(key: string, capture: LiveCapture) {
    setReferences((current) =>
      current.map((reference) =>
        reference.key === key
          ? { ...reference, interpretationStatus: "thinking", interpretationError: undefined }
          : reference,
      ),
    );

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capture }),
        signal: AbortSignal.timeout(90_000),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "The Evidence Interpreter could not complete this run.";
        throw new Error(message);
      }

      const interpretation = evidenceInterpretationSchema.parse(payload);
      setReferences((current) =>
        current.map((reference) =>
          reference.key === key
            ? { ...reference, interpretation, interpretationStatus: "ready", interpretationError: undefined }
            : reference,
        ),
      );
      setDraftRule((current) =>
        current === capture.finding.candidateRule ? interpretation.candidateRule : current,
      );
    } catch (error) {
      setReferences((current) =>
        current.map((reference) =>
          reference.key === key
            ? {
                ...reference,
                interpretationStatus: "error",
                interpretationError:
                  error instanceof Error
                    ? error.message
                    : "The Evidence Interpreter could not complete this run.",
              }
            : reference,
        ),
      );
    }
  }

  async function startCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (captureStatus === "capturing") return;

    const data = new FormData(event.currentTarget);
    const url = String(data.get("url") ?? "").trim();
    const intent = String(data.get("intent") ?? "").trim();
    setLastUrl(url);
    setCapturePhase(0);
    setCaptureStatus("capturing");
    setCaptureError(null);
    setProject(null);

    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, intent: intent || undefined }),
        signal: AbortSignal.timeout(115_000),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const parsedError = captureErrorSchema.safeParse(payload);
        throw new Error(
          parsedError.success
            ? parsedError.data.error.message
            : "The live run failed without returning a readable reason.",
        );
      }

      const capture = liveCaptureSchema.parse(payload);
      const key = `${capture.source.url}:${capture.capturedAt}`;
      setReferences((current) => [...current, { key, capture, interpretationStatus: "thinking" }]);
      setActiveKey(key);
      setDraftRule(capture.finding.candidateRule);
      setDraftNote("");
      setDraftJudgment(null);
      setCaptureStatus("ready");
      window.setTimeout(() => evidenceRegion.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      void requestInterpretation(key, capture);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "TimeoutError"
          ? "The browser journey took too long. Nothing stored was substituted; retry the same URL."
          : error instanceof Error
            ? error.message
            : "The live capture failed. Nothing stored was substituted.";
      setCaptureError(message);
      setCaptureStatus("error");
    }
  }

  function attachDecision() {
    if (!activeReference || !draftJudgment || !draftRule.trim()) return;
    const decision: HumanDecision = {
      judgment: draftJudgment,
      rule: draftRule.trim(),
      note: draftNote.trim() || undefined,
    };
    setReferences((current) =>
      current.map((reference) => (reference.key === activeReference.key ? { ...reference, decision } : reference)),
    );
    setProject(null);
  }

  function selectReference(reference: SessionReference) {
    setActiveKey(reference.key);
    setDraftRule(reference.decision?.rule ?? reference.capture.finding.candidateRule);
    setDraftNote(reference.decision?.note ?? "");
    setDraftJudgment(reference.decision?.judgment ?? null);
  }

  async function compileProject() {
    if (!decidedReferences.length) return;
    setCompileStatus("thinking");
    setCompileError(null);
    setProject(null);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle.trim() || "Untitled experience",
          brief: projectBrief.trim() || "Create an original interactive experience.",
          desiredAffect: desiredAffect.split(",").map((item) => item.trim()).filter(Boolean),
          references: decidedReferences.map(({ capture, decision, interpretation }) => ({
            capture,
            decision,
            interpretation,
          })),
        }),
        signal: AbortSignal.timeout(90_000),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "The Genome Synthesizer could not complete this run.";
        throw new Error(message);
      }
      setProject(portableProjectGenomeSchema.parse(payload));
      setCompileStatus("idle");
      window.setTimeout(() => document.getElementById("compiled-output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (error) {
      setCompileStatus("error");
      setCompileError(error instanceof Error ? error.message : "The Genome Synthesizer could not complete this run.");
    }
  }

  function compileProjectLocally() {
    if (!decidedReferences.length) return;
    setProject(compileSessionGenome({
      title: projectTitle,
      brief: projectBrief,
      desiredAffect: desiredAffect.split(","),
      references: decidedReferences.map(({ capture, decision }) => ({ capture, decision })),
    }));
    setCompileStatus("idle");
    setCompileError(null);
    window.setTimeout(() => document.getElementById("compiled-output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function captureAnother() {
    setCaptureStatus("idle");
    setCaptureError(null);
    window.setTimeout(() => {
      urlInput.current?.focus();
      document.getElementById("capture-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }

  function startFreshSession() {
    setReferences([]);
    setActiveKey(null);
    setCaptureStatus("idle");
    setCaptureError(null);
    setProject(null);
    setDraftRule("");
    setDraftNote("");
    setDraftJudgment(null);
    void clearWorkshopSession().catch(() => undefined);
    window.setTimeout(() => document.getElementById("capture-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
  }

  async function copyAgentContext() {
    if (!project) return;
    const files = buildSessionPackFiles(
      project,
      decidedReferences.map(({ capture, decision }) => ({ capture, decision })),
    );
    const context = files.find((file) => file.path === "agents/AGENTS.md")?.content;
    if (!context) return;
    await navigator.clipboard.writeText(context);
    setCopyStatus("copied");
    window.setTimeout(() => setCopyStatus("idle"), 1_600);
  }

  return (
    <section className={styles.workshop} id="capture-lab">
      <header className={styles.intro}>
        <div className={styles.kicker}><span>LIVE INSTRUMENT</span><i /> ANY PUBLIC URL</div>
        <h2>Bring the web<br /><em>you actually love.</em></h2>
        <div className={styles.introAside}>
          <p>Paste a public page. A Bright Data browser will visit it now—not replay a prepared result.</p>
          <div><ShieldCheck size={17} /><span>One URL → one bounded live journey</span></div>
          <div><Eye size={17} /><span>Observed, inferred, and unknown stay separate</span></div>
        </div>
      </header>

      <div className={styles.pipeline} aria-label="Compiler stages">
        {[
          ["1", "Capture"],
          ["2", "Understand"],
          ["3", "Judge"],
          ["4", "Compile"],
        ].map(([number, label], index) => {
          const completed =
            index === 0
              ? references.length > 0
              : index === 1
                ? references.some((reference) => reference.interpretationStatus === "ready")
                : index === 2
                  ? decidedReferences.length > 0
                  : Boolean(project);
          return (
            <div data-complete={completed} key={label}>
              <span>{completed ? <Check size={13} /> : number}</span><strong>{label}</strong>
              {index < 3 && <ChevronRight size={15} />}
            </div>
          );
        })}
      </div>

      <section className={styles.capturePanel} id="capture-form">
        <div className={styles.capturePrompt}>
          <span className={styles.stepNumber}>01</span>
          <div>
            <small>START WITH A REAL REFERENCE</small>
            <h3>Which experience should we visit?</h3>
            <p>The result will come from this URL live. If collection fails, you will see the failure.</p>
          </div>
        </div>

        <form onSubmit={startCapture}>
          <label className={styles.urlField}>
            <Globe2 size={21} />
            <span className={styles.srOnly}>Public website URL</span>
            <input
              autoComplete="url"
              name="url"
              placeholder="https://your-reference.com"
              ref={urlInput}
              required
              type="text"
            />
            <button disabled={captureStatus === "capturing"} type="submit">
              {captureStatus === "capturing" ? <LoaderCircle className={styles.spin} size={18} /> : <Sparkles size={18} />}
              {captureStatus === "capturing" ? "Capturing live…" : "Start live capture"}
            </button>
          </label>
          <label className={styles.intentField}>
            <span>What caught your attention? <i>Optional—only you can supply this.</i></span>
            <textarea
              name="intent"
              placeholder="For example: the way the story stays pinned while each scene changes…"
              rows={2}
            />
          </label>
        </form>

        {captureStatus === "capturing" && (
          <div className={styles.captureJourney} aria-live="polite">
            <div className={styles.orbit}><span /><i /><b /></div>
            <div className={styles.phaseCopy}>
              <small>LIVE BROWSER JOURNEY</small>
              <strong>{CAPTURE_PHASES[capturePhase].title}</strong>
              <p>{CAPTURE_PHASES[capturePhase].detail}</p>
            </div>
            <div className={styles.phaseRail}>
              {CAPTURE_PHASES.map((phase, index) => (
                <span data-active={index <= capturePhase} key={phase.title} />
              ))}
            </div>
          </div>
        )}

        {captureStatus === "error" && captureError && (
          <div className={styles.captureFailure} role="alert">
            <span><AlertTriangle size={22} /></span>
            <div><strong>Live capture did not complete.</strong><p>{captureError}</p></div>
            <button onClick={() => { setCaptureStatus("idle"); setCaptureError(null); urlInput.current?.focus(); }} type="button">
              <RotateCcw size={15} /> Retry {lastUrl ? "this URL" : "capture"}
            </button>
          </div>
        )}
      </section>

      {references.length > 0 && (
        <div className={styles.evidenceWorkspace} ref={evidenceRegion}>
          <aside className={styles.referenceShelf}>
            <div className={styles.shelfHeading}>
              <small>YOUR SESSION</small>
              <strong>{capturedLabel(references.length)}</strong>
            </div>
            <div className={styles.referenceList}>
              {references.map((reference, index) => (
                <button
                  data-active={reference.key === activeKey}
                  key={reference.key}
                  onClick={() => selectReference(reference)}
                  type="button"
                >
                  <i>{index + 1}</i>
                  <span><strong>{reference.capture.source.name}</strong><small>{reference.capture.source.host}</small></span>
                  {reference.decision ? (
                    <b data-judgment={reference.decision.judgment}>
                      {reference.decision.judgment === "preferred" ? <Heart size={13} /> : <ThumbsDown size={13} />}
                    </b>
                  ) : <ChevronRight size={16} />}
                </button>
              ))}
            </div>
            <button className={styles.addReference} onClick={captureAnother} type="button"><Plus size={15} /> Capture another URL</button>
            <button className={styles.resetSession} onClick={startFreshSession} type="button"><RotateCcw size={13} /> Start a fresh session</button>
            <p>Each reference above came from a separate live browser run in this session.</p>
          </aside>

          {activeReference && (
            <div className={styles.evidenceMain}>
              <header className={styles.evidenceHeader}>
                <div>
                  <span className={styles.liveBadge}><i /> LIVE CAPTURE VERIFIED BY BRIGHT DATA</span>
                  <h3>{activeReference.capture.source.name}</h3>
                  <a href={activeReference.capture.source.url} rel="noreferrer" target="_blank"><Link2 size={13} /> {activeReference.capture.source.host}</a>
                </div>
                <div className={styles.captureReceipt}>
                  <CheckCircle2 size={19} />
                  <span>
                    <small>CAPTURE COMPLETED</small>
                    <strong>
                      {activeReference.capture.verification.evidenceLayers.includes("rendered-browser")
                        ? "Structured trace + rendered frames"
                        : "Structured trace"}
                      {` · ${(activeReference.capture.durationMs / 1000).toFixed(1)}s`}
                    </strong>
                  </span>
                </div>
              </header>

              <section className={styles.traceSection}>
                <div className={styles.sectionHeading}>
                  <span className={styles.stepNumber}>02</span>
                  <div><small>WHAT ACTUALLY HAPPENED</small><h4>Follow the experience trace.</h4></div>
                </div>
                <div className={styles.momentTrack}>
                  {activeReference.capture.moments.map((moment, index) => (
                    <div className={styles.momentGroup} key={`${activeReference.key}:${moment.order}`}>
                      <article className={styles.momentCard}>
                        <div className={styles.momentSky} data-rendered={Boolean(moment.visual)}>
                          {moment.visual ? (
                            // This data URL is returned by our same-origin capture endpoint.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={`Rendered browser frame from ${activeReference.capture.source.name} at ${Math.round(moment.visual.scrollProgress * 100)}% scroll`}
                              src={moment.visual.imageDataUrl}
                            />
                          ) : (
                            <><i /><b /></>
                          )}
                          <span>{String(moment.order).padStart(2, "0")}</span>
                          {moment.visual && (
                            <em>
                              RENDERED FRAME · {Math.round(moment.visual.scrollProgress * 100)}% PAGE
                            </em>
                          )}
                        </div>
                        <small>{stageLabel(moment.order, activeReference.capture.moments.length)}</small>
                        <h5>{moment.heading ?? moment.stage}</h5>
                        <p>{moment.excerpt ?? "No readable excerpt was returned for this moment."}</p>
                        <footer>
                          <span>{moment.actionBefore}</span>
                          {moment.visual && (
                            <small>
                              {moment.visual.runningAnimations} active motion{moment.visual.runningAnimations === 1 ? "" : "s"}
                              {moment.visual.fixedElements + moment.visual.stickyElements > 0
                                ? ` · ${moment.visual.fixedElements + moment.visual.stickyElements} anchored layer${moment.visual.fixedElements + moment.visual.stickyElements === 1 ? "" : "s"}`
                                : ""}
                            </small>
                          )}
                        </footer>
                      </article>
                      {activeReference.capture.transitions[index] && (
                        <div className={styles.transitionArrow}>
                          <ArrowRight size={19} />
                          <span>{activeReference.capture.transitions[index].action}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.agentStatus} data-status={activeReference.interpretationStatus}>
                <span className={styles.agentGlyph}>
                  {activeReference.interpretationStatus === "thinking" ? (
                    <LoaderCircle className={styles.spin} size={20} />
                  ) : activeReference.interpretationStatus === "ready" ? (
                    <BrainCircuit size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                </span>
                <div>
                  <small>EVIDENCE INTERPRETER</small>
                  {activeReference.interpretationStatus === "thinking" ? (
                    <><strong>Reasoning across the trace and rendered frames…</strong><p>The live evidence is already safe; this agent is separating observation, inference, and unknowns.</p></>
                  ) : activeReference.interpretationStatus === "ready" ? (
                    <>
                      <strong>Interpretation complete · provenance checks passed</strong>
                      <p>{activeInterpretation?.agent.model} produced the reading below; deterministic checks verified every observed citation.</p>
                    </>
                  ) : (
                    <><strong>Agent interpretation unavailable</strong><p>{activeReference.interpretationError} The grounded first-pass reading remains below.</p></>
                  )}
                </div>
                {activeReference.interpretationStatus === "error" && (
                  <button onClick={() => void requestInterpretation(activeReference.key, activeReference.capture)} type="button">
                    <RotateCcw size={14} /> Retry interpreter
                  </button>
                )}
              </section>

              {activeFinding && <section className={styles.truthGrid}>
                <article>
                  <span className={styles.observedLabel}><Eye size={14} /> OBSERVED</span>
                  <h4>{activeFinding.observation}</h4>
                  <p>Grounded in the ordered moments above.</p>
                </article>
                <article>
                  <span className={styles.inferredLabel}><WandSparkles size={14} /> INFERRED</span>
                  <h4>{activeFinding.inference}</h4>
                  <p>A bounded interpretation—not a direct measurement.</p>
                </article>
                <article>
                  <span className={styles.unknownLabel}><AlertTriangle size={14} /> STILL UNKNOWN</span>
                  <h4>{activeFinding.caveat}</h4>
                  <p>Unknowns remain visible instead of being filled with confident prose.</p>
                </article>
              </section>}

              {activeInterpretation && (
                <section className={styles.claimSection}>
                  <header>
                    <div><small>AGENT REASONING MAP</small><h4>Every claim keeps its basis.</h4></div>
                    <span><ShieldCheck size={15} /> VERIFIED</span>
                  </header>
                  <div className={styles.claimGrid}>
                    {activeInterpretation.claims.map((claim) => (
                      <article data-basis={claim.epistemicBasis} key={`${claim.title}:${claim.statement}`}>
                        <div>
                          <span>{claim.epistemicBasis}</span>
                          <small>{claim.dimension} · {claim.confidence} confidence</small>
                        </div>
                        <h5>{claim.title}</h5>
                        <p>{claim.statement}</p>
                        <footer>
                          {claim.evidenceMoments.length
                            ? `Evidence: ${claim.evidenceMoments
                                .map((order) => activeReference.capture.moments.find((moment) => moment.order === order)?.stage)
                                .filter(Boolean)
                                .join(" + ")}`
                            : "No direct evidence claimed"}
                        </footer>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className={styles.judgmentSection}>
                <div className={styles.judgmentIntro}>
                  <span className={styles.stepNumber}>03</span>
                  <small>NOW THE MACHINE STOPS</small>
                  <h4>Did this principle matter <em>to you?</em></h4>
                  <p>The capture can establish what happened. Your decision establishes whether it belongs in your project.</p>
                </div>
                <div className={styles.ruleEditor}>
                  <label>
                    <span>CANDIDATE EXPERIENCE RULE</span>
                    <textarea onChange={(event) => setDraftRule(event.target.value)} rows={3} value={draftRule} />
                  </label>
                  <div className={styles.judgmentButtons}>
                    <button data-selected={draftJudgment === "preferred"} onClick={() => setDraftJudgment("preferred")} type="button">
                      <Heart size={19} /> <span><strong>Keep this</strong><small>Carry the principle forward</small></span>
                    </button>
                    <button data-selected={draftJudgment === "rejected"} onClick={() => setDraftJudgment("rejected")} type="button">
                      <ThumbsDown size={19} /> <span><strong>Leave it behind</strong><small>Record an explicit rejection</small></span>
                    </button>
                  </div>
                  <label>
                    <span>WHY? <i>Optional, but this is where taste becomes reusable.</i></span>
                    <textarea
                      onChange={(event) => setDraftNote(event.target.value)}
                      placeholder="I love the patient weight of this reveal, but not its exact visual style…"
                      rows={2}
                      value={draftNote}
                    />
                  </label>
                  <button className={styles.attachButton} disabled={!draftJudgment || !draftRule.trim()} onClick={attachDecision} type="button">
                    {activeReference.decision ? <Check size={17} /> : <Sparkles size={17} />}
                    {activeReference.decision ? "Update human judgment" : "Attach human judgment"}
                  </button>
                  {activeReference.decision && (
                    <div className={styles.decisionSaved}><CheckCircle2 size={15} /> Judgment attached to this live evidence.</div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {decidedReferences.length > 0 && (
        <section className={styles.compilerSection}>
          <div className={styles.compilerIntro}>
            <span className={styles.stepNumber}>04</span>
            <small>PROJECT GENOME</small>
            <h3>Turn judgment into<br /><em>portable context.</em></h3>
            <p>Selected and rejected principles become a clean project artifact. Source pixels, copy, geometry, and exact timing stay behind.</p>
            <div className={styles.selectedSources}>
              {decidedReferences.map((reference) => (
                <span key={reference.key} data-judgment={reference.decision.judgment}>
                  {reference.decision.judgment === "preferred" ? <Heart size={12} /> : <ThumbsDown size={12} />}
                  {reference.capture.source.name}
                </span>
              ))}
            </div>
            <button className={styles.secondaryCapture} onClick={captureAnother} type="button"><Plus size={15} /> Add another live reference</button>
          </div>
          <div className={styles.compilerForm}>
            <label><span>PROJECT NAME</span><input onChange={(event) => setProjectTitle(event.target.value)} value={projectTitle} /></label>
            <label><span>WHAT ARE YOU BUILDING?</span><textarea onChange={(event) => setProjectBrief(event.target.value)} rows={4} value={projectBrief} /></label>
            <label><span>DESIRED FEELING <i>comma separated</i></span><input onChange={(event) => setDesiredAffect(event.target.value)} value={desiredAffect} /></label>
            <button className={styles.compileButton} disabled={compileStatus === "thinking"} onClick={() => void compileProject()} type="button">
              {compileStatus === "thinking" ? <LoaderCircle className={styles.spin} size={19} /> : <BrainCircuit size={19} />}
              {compileStatus === "thinking" ? "Genome Synthesizer is reasoning…" : "Synthesize Project Genome"}
              {compileStatus !== "thinking" && <ArrowDown size={16} />}
            </button>
            <p><ShieldCheck size={13} /> The synthesis agent proposes rules; a deterministic verifier enforces provenance, judgment lanes, unknowns, and anti-copy constraints.</p>
            {compileStatus === "error" && (
              <div className={styles.compileFailure} role="alert">
                <AlertTriangle size={18} />
                <span><strong>Agent synthesis did not complete.</strong><small>{compileError}</small></span>
                <button onClick={compileProjectLocally} type="button">Use local compiler</button>
              </div>
            )}
          </div>
        </section>
      )}

      {project && (
        <section className={styles.outputSection} id="compiled-output">
          <header>
            <div>
              <span>
                PROJECT GENOME COMPILED · {project.compiler.mode === "agent" ? `${project.compiler.model} + PROVENANCE VERIFIER` : "LOCAL COMPILER + PROVENANCE VERIFIER"}
              </span>
              <h3>{project.title}</h3><p>{project.brief}</p>
            </div>
            <div className={styles.outputActions}>
              <button onClick={copyAgentContext} type="button"><Clipboard size={16} /> {copyStatus === "copied" ? "Copied" : "Copy agent context"}</button>
              <button onClick={() => downloadSessionPack(project, decidedReferences.map(({ capture, decision }) => ({ capture, decision })))} type="button">
                <Download size={17} /> Download Experience Pack
              </button>
            </div>
          </header>
          <div className={styles.outputBody}>
            <div className={styles.ruleStack}>
              {project.rules.map((rule) => (
                <article data-transformation={rule.transformation} key={rule.title}>
                  <span>{rule.transformation}</span>
                  <h4>{rule.title}</h4>
                  <p>{rule.rule}</p>
                  <p className={styles.ruleRationale}><strong>Why:</strong> {rule.rationale}</p>
                  <footer>{rule.source ? `From ${rule.source}, transformed for this project` : "Invented for this project"}</footer>
                </article>
              ))}
            </div>
            <aside className={styles.packPreview}>
              <div className={styles.packOrb}><FileArchive size={30} /><i /><b /></div>
              <small>PORTABLE EXPERIENCE PACK</small>
              <h4>One artifact.<br />Every coding AI.</h4>
              <ul>
                <li><span>genome/</span> Project rules + evidence</li>
                <li><span>design/</span> Principles + unknowns</li>
                <li><span>intent/</span> Brief + anti-copy contract</li>
                <li><span>agents/</span> Codex, Claude, Gemini, Cursor, Copilot</li>
              </ul>
              <div className={styles.agentRow}><span>Codex</span><span>Claude</span><span>Gemini</span><span>Cursor</span></div>
            </aside>
          </div>
        </section>
      )}
    </section>
  );
}

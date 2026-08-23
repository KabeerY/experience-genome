"use client";

import {
  ArrowDown,
  ArrowRight,
  Box,
  Braces,
  Check,
  CircleDot,
  Compass,
  Download,
  Eye,
  Fingerprint,
  Heart,
  Link2,
  MessageCircle,
  MousePointer2,
  Play,
  ScanLine,
  Sparkles,
  Wind,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react";

import { downloadExperiencePack } from "@/lib/compiler/experience-pack";
import {
  demoGenomes,
  demoProjectGenome,
  demoTrace,
  demoTraces,
  realWebProjectRule,
  realWebTrace,
} from "@/lib/demo-data";
import type { GenomeClaim } from "@/lib/genome/schema";

import { ArchiveScene } from "./archive-scene";
import styles from "./experience-story.module.css";

type WorkshopMode = "choose" | "guided" | "custom";
type ReferenceChoice = "archive" | "linear";
type Judgment = "unreviewed" | "preferred" | "rejected";
type ReplayStatus = "idle" | "playing" | "done";
type QuestStage = "choose" | "observe" | "judge" | "compile" | "complete";
type CustomBrief = {
  host: string;
  note: string;
  url: string;
};

function SectionIndex({ children }: { children: string }) {
  return <span className={styles.sectionIndex}>{children}</span>;
}

function StoryWorkshop() {
  const [mode, setMode] = useState<WorkshopMode>("choose");
  const [reference, setReference] = useState<ReferenceChoice | null>(null);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus>("idle");
  const [observationConfirmed, setObservationConfirmed] = useState(false);
  const [judgment, setJudgment] = useState<Judgment>("unreviewed");
  const [packStatus, setPackStatus] = useState<"idle" | "working" | "done">("idle");
  const [customBrief, setCustomBrief] = useState<CustomBrief | null>(null);

  const trace = reference === "linear" ? realWebTrace : demoTrace;
  const questStage: QuestStage =
    reference === null
      ? "choose"
      : !observationConfirmed
        ? "observe"
        : judgment === "unreviewed"
          ? "judge"
          : packStatus === "done"
            ? "complete"
            : "compile";
  const questStep = {
    choose: 1,
    observe: 2,
    judge: 3,
    compile: 4,
    complete: 4,
  }[questStage];

  useEffect(() => {
    if (mode !== "guided") return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("guided-quest")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mode, questStage]);

  const guidedGenomes = useMemo(
    () =>
      demoGenomes.map((genome) => ({
        ...genome,
        claims: genome.claims.map((claim) =>
          claim.id === "LC01"
            ? {
                ...claim,
                humanJudgment: judgment,
                humanNote:
                  judgment === "preferred"
                    ? "Selected by the human during the guided quest."
                    : judgment === "rejected"
                      ? "Rejected by the human during the guided quest."
                      : undefined,
              }
            : claim,
        ) as GenomeClaim[],
      })),
    [judgment],
  );

  const guidedProject = useMemo(
    () => ({
      ...demoProjectGenome,
      rules: [
        ...demoProjectGenome.rules,
        ...(judgment === "preferred" ? [realWebProjectRule] : []),
      ],
    }),
    [judgment],
  );

  async function compilePack() {
    setPackStatus("working");
    await downloadExperiencePack({ traces: demoTraces, genomes: guidedGenomes, project: guidedProject });
    setPackStatus("done");
  }

  function startGuidedQuest() {
    setReference(null);
    setReplayStatus("idle");
    setObservationConfirmed(false);
    setJudgment("unreviewed");
    setPackStatus("idle");
    setMode("guided");
  }

  function chooseReference(nextReference: ReferenceChoice) {
    setReference(nextReference);
    setReplayStatus("idle");
    setObservationConfirmed(false);
    setJudgment("unreviewed");
    setPackStatus("idle");
  }

  async function replayTrace() {
    if (replayStatus === "playing") return;
    setReplayStatus("playing");
    await new Promise((resolve) => window.setTimeout(resolve, 1900));
    setReplayStatus("done");
  }

  function prepareCustomBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = String(data.get("referenceUrl") ?? "").trim();
    const suppliedNote = String(data.get("humanNote") ?? "").trim();
    const parsed = new URL(url);

    setCustomBrief({
      host: parsed.hostname.replace(/^www\./, ""),
      note:
        suppliedNote ||
        "Preserve the scroll rhythm, layered motion, section transitions, and the order in which meaning is revealed.",
      url: parsed.toString(),
    });
  }

  return (
    <section className={styles.workshop} id="workshop">
      <div className={styles.workshopHeading}>
        <div>
          <SectionIndex>THE EXPERIENCE WORKSHOP</SectionIndex>
          <h2>The story becomes<br /><em>your instrument.</em></h2>
        </div>
        <p>
          Choose a guided expedition or prepare your own public reference. Evidence, inference,
          and your judgment remain visibly separate.
        </p>
      </div>

      {mode === "choose" && (
        <div className={styles.modeChooser}>
          <button onClick={startGuidedQuest} type="button">
            <span className={styles.modeIcon}><Compass size={30} /></span>
            <small>RECOMMENDED / 3 MINUTES</small>
            <h3>Play the guided quest</h3>
            <p>Akshar and Gati guide every click through real persisted Bright Data evidence.</p>
            <strong>Begin expedition <ArrowRight size={18} /></strong>
          </button>
          <button onClick={() => setMode("custom")} type="button">
            <span className={`${styles.modeIcon} ${styles.modeIconWarm}`}><Link2 size={28} /></span>
            <small>YOUR PUBLIC REFERENCE</small>
            <h3>Prepare your own capture</h3>
            <p>Supply a URL and tell the compiler what you care about before collection begins.</p>
            <strong>Open composer <ArrowRight size={18} /></strong>
          </button>
        </div>
      )}

      {mode === "guided" && (
        <div className={styles.questShell} id="guided-quest">
          <header className={styles.questHeader}>
            <button onClick={() => setMode("choose")} type="button">← Modes</button>
            <div className={styles.questProgress}>
              {["Choose", "Observe", "Judge", "Compile"].map((label, index) => (
                <div
                  className={
                    questStage === "complete" || index + 1 < questStep
                      ? styles.questDone
                      : index + 1 === questStep
                        ? styles.questActive
                        : ""
                  }
                  key={label}
                >
                  <span>{questStage === "complete" || index + 1 < questStep ? <Check size={13} /> : index + 1}</span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
            <span className={styles.zeroCost}><CircleDot size={13} /> VERIFIED REPLAY · 0 LIVE CREDITS</span>
          </header>

          <div className={styles.missionGuide} data-stage={questStage}>
            <span className={styles.gatiAvatar}><Wind size={20} /></span>
            <div>
              <small>MISSION {questStep} OF 4 · GATI IS GUIDING YOU</small>
              <strong>
                {questStage === "choose" && "Choose the evidence source marked START HERE."}
                {questStage === "observe" && replayStatus === "idle" && "Press Play to watch the captured experience unfold."}
                {questStage === "observe" && replayStatus === "playing" && "Watch the state sequence—not just the screenshots."}
                {questStage === "observe" && replayStatus === "done" && "Evidence recovered. Continue when the sequence makes sense."}
                {questStage === "judge" && "Now supply what the machine cannot: did this matter to you?"}
                {questStage === "compile" && "Your judgment is attached. Compile it into portable creative memory."}
                {questStage === "complete" && "Quest complete. You turned a web experience into agent-ready context."}
              </strong>
            </div>
            <span className={styles.missionReward}>+{questStep * 25} XP</span>
          </div>

          {questStage === "choose" && (
            <section className={styles.choiceStage}>
              <div className={styles.stageHeading}>
                <small>01 / CHOOSE</small>
                <h3>Which evidence should we investigate?</h3>
                <p>Start with a persisted real-web capture. Nothing here launches a live scraper.</p>
              </div>
              <div className={styles.sourceQuestCards}>
                <button className={styles.startSource} onClick={() => chooseReference("linear")} type="button">
                  <span className={styles.startFlag}><MousePointer2 size={14} /> START HERE</span>
                  <i>B</i>
                  <div><small>REAL WEB · BRIGHT DATA VERIFIED</small><strong>Linear public landing page</strong><p>Replay three scroll-separated semantic regions.</p></div>
                  <ArrowRight size={24} />
                </button>
                <button onClick={() => chooseReference("archive")} type="button">
                  <span className={styles.optionalFlag}>OPTIONAL RELIABILITY FIXTURE</span>
                  <i>A</i>
                  <div><small>CONTROLLED · BRIGHT DATA VERIFIED</small><strong>Monsoon Archive</strong><p>Replay a complete state/action/state contract.</p></div>
                  <ArrowRight size={20} />
                </button>
              </div>
            </section>
          )}

          {questStage === "observe" && reference && (
            <section className={styles.observeStage}>
              <div className={styles.stageHeadingRow}>
                <div><small>02 / OBSERVE</small><h3>Replay the experience trace.</h3></div>
                <button onClick={() => chooseReference(reference === "linear" ? "archive" : "linear")} type="button">Switch source</button>
              </div>
              <div className={styles.questEvidence}>
                <div className={styles.evidenceTopline}>
                  <div><small>EXPERIENCE TRACE</small><strong>{trace.sourceName}</strong></div>
                  <code>{trace.collectorId.slice(0, 7)}…{trace.collectorId.slice(-3)}</code>
                </div>
                <div className={styles.steppingTrace} data-replay={replayStatus}>
                  {trace.states.map((state, index) => (
                    <div className={styles.traceStep} key={state.id}>
                      <article style={{ "--step-index": index } as CSSProperties}>
                        <span>{state.id}</span>
                        <div className={styles.traceIllustration} data-step={index + 1}><i /><b /></div>
                        <small>{state.label}</small>
                        <strong>{state.heading}</strong>
                      </article>
                      {trace.actions[index] && (
                        <div className={styles.traceAction}><ArrowDown size={15} /><span>{trace.actions[index].label}</span></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.traceHonesty}>
                  <ScanLine size={17} />
                  <p><strong>Observed:</strong> ordered regions and prior actions. <strong>Unresolved:</strong> exact easing, frame timing, pointer physics, and audio.</p>
                </div>
              </div>
              <div className={styles.stageActionBar}>
                {replayStatus !== "done" ? (
                  <button className={styles.primaryQuestAction} disabled={replayStatus === "playing"} onClick={replayTrace} type="button">
                    {replayStatus === "playing" ? <><Sparkles size={18} /> Replaying S01 → S02 → S03…</> : <><Play size={18} /> Play the 3 captured states</>}
                  </button>
                ) : (
                  <button className={styles.primaryQuestAction} onClick={() => setObservationConfirmed(true)} type="button">Evidence understood — continue <ArrowRight size={18} /></button>
                )}
                <span>{replayStatus === "done" ? "TRACE UNLOCKED · +25 XP" : "YOUR NEXT CLICK"}</span>
              </div>
            </section>
          )}

          {questStage === "judge" && reference && (
            <section className={styles.judgeStage}>
              <div className={styles.stageHeading}>
                <small>03 / JUDGE</small>
                <h3>The machine observed a rule. Only you can value it.</h3>
              </div>
              <div className={styles.judgeQuestCard}>
                <div className={styles.truthBadges}><span><Eye size={12} /> OBSERVED</span><code>{trace.states.map((state) => state.id).join(" → ")}</code></div>
                <h3>{reference === "linear" ? "Successive scrolls traverse three semantic regions." : "Spatial arrival precedes semantic reveal."}</h3>
                <p>Should this principle enter your Project Genome?</p>
                <div className={styles.judgmentActions}>
                  <button className={styles.recommendedChoice} onClick={() => setJudgment("preferred")} type="button"><Heart size={18} /> Keep this principle <span>RECOMMENDED</span></button>
                  <button onClick={() => setJudgment("rejected")} type="button">Reject it</button>
                </div>
              </div>
            </section>
          )}

          {questStage === "compile" && reference && (
            <section className={styles.compileStage}>
              <div className={styles.stageHeading}>
                <small>04 / COMPILE</small>
                <h3>{judgment === "preferred" ? "Your preferred rule is ready to become portable." : "Your rejection is part of the creative memory too."}</h3>
              </div>
              <div className={styles.compileChain}>
                <span><small>EVIDENCE</small><strong>{trace.states[0]?.id}–{trace.states.at(-1)?.id}</strong></span><ArrowRight size={18} />
                <span><small>OBSERVATION</small><strong>{reference === "linear" ? "LC01" : "C01"}</strong></span><ArrowRight size={18} />
                <span><small>JUDGMENT</small><strong>{judgment.toUpperCase()}</strong></span><ArrowRight size={18} />
                <span><small>PROJECT RULE</small><strong>{judgment === "preferred" ? "R05" : "REJECTED"}</strong></span><ArrowRight size={18} />
                <span><small>OUTPUT</small><strong>AGENTS.md</strong></span>
              </div>
              <button className={styles.compileQuestButton} disabled={packStatus === "working"} onClick={compilePack} type="button">
                {packStatus === "working" ? <><Sparkles size={19} /> Compiling evidence + judgment…</> : <><Download size={19} /> Compile and download Experience Pack</>}
              </button>
              <p className={styles.compileHint}>One click creates the vendor-neutral pack for Codex, Claude, Gemini, Cursor, and humans.</p>
            </section>
          )}

          {questStage === "complete" && (
            <section className={styles.completeStage}>
              <div className={styles.questBurst}><Sparkles size={38} /></div>
              <small>EXPEDITION COMPLETE · 100 XP</small>
              <h3>You compiled an experience,<br />not a screenshot.</h3>
              <p>The downloaded pack contains evidence, unknowns, human judgment, anti-copy rules, and agent adapters.</p>
              <div className={styles.questAchievements}>
                <span><Check size={15} /> Real evidence inspected</span>
                <span><Check size={15} /> Human judgment attached</span>
                <span><Check size={15} /> Project rule synthesized</span>
                <span><Check size={15} /> Experience Pack downloaded</span>
              </div>
              <div className={styles.completeActions}>
                <Link href="/studio">Open the full Genome Lens <ArrowRight size={18} /></Link>
                <button onClick={startGuidedQuest} type="button">Replay quest</button>
              </div>
            </section>
          )}

          {questStage !== "complete" && (
            <div className={styles.questSafetyLine}><CircleDot size={12} /> This guided quest replays persisted Bright Data results and spends zero live credits.</div>
          )}
        </div>
      )}

      {mode === "custom" && (
        <div className={styles.customShell}>
          <button className={styles.backButton} onClick={() => setMode("choose")} type="button">← Modes</button>
          <div className={styles.customCopy}>
            <span className={styles.aksharAvatar}><Braces size={22} /></span>
            <small>AKSHAR / CAPTURE COMPOSER</small>
            <h3>Which world should we observe?</h3>
            <p>A URL supplies the experience. Your note supplies the normative question the machine cannot answer alone.</p>
          </div>
          {!customBrief ? (
            <form onSubmit={prepareCustomBrief}>
              <label>PUBLIC REFERENCE URL<input name="referenceUrl" placeholder="https://example.com" required type="url" /></label>
              <label>WHAT MATTERED TO YOU? <span>OPTIONAL</span><textarea name="humanNote" placeholder="Leave blank and we’ll inspect scroll rhythm, layered motion, transitions, and reveal order." rows={4} /></label>
              <button type="submit"><Play size={17} /> Prepare capture brief</button>
              <small className={styles.formHint}>This prepares the observation plan locally. It does not spend a Bright Data credit.</small>
            </form>
          ) : (
            <div aria-live="polite" className={styles.customNotice} role="status">
              <div className={styles.noticeHeading}>
                <span><Fingerprint size={22} /></span>
                <div><small>READY · 0 CREDITS SPENT</small><strong>Capture brief ready for {customBrief.host}.</strong></div>
              </div>
              <dl className={styles.briefDetails}>
                <div><dt>REFERENCE</dt><dd>{customBrief.url}</dd></div>
                <div><dt>OBSERVE</dt><dd>Scroll states, pinned elements, depth cues, transition order, and semantic reveals.</dd></div>
                <div><dt>HUMAN QUESTION</dt><dd>{customBrief.note}</dd></div>
              </dl>
              <p><strong>{customBrief.host} has not been scraped.</strong> Live collection remains operator-gated to protect 4,993 judge credits. The separate verified demo uses persisted Linear evidence.</p>
              <div className={styles.noticeActions}>
                <button className={styles.secondaryNoticeAction} onClick={() => setCustomBrief(null)} type="button">Use a different URL</button>
                <button onClick={startGuidedQuest} type="button">Launch separate guided demo <ArrowRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ExperienceStory() {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateProgress = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(distance > 0 ? Math.min(window.scrollY / distance, 1) : 0);
    };
    updateMotion();
    updateProgress();
    media.addEventListener("change", updateMotion);
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      media.removeEventListener("change", updateMotion);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <main className={styles.story} style={{ "--scroll": progress } as CSSProperties}>
      <div className={styles.landscape} aria-hidden="true">
        <Image alt="" fill priority sizes="100vw" src="/art/monsoon-archive-landscape.png" />
        <div className={styles.landscapeVeil} />
      </div>
      <div className={styles.scene} aria-hidden="true"><ArchiveScene progress={progress} reducedMotion={reducedMotion} /></div>
      <div className={styles.cloudOne} aria-hidden="true" />
      <div className={styles.cloudTwo} aria-hidden="true" />
      <div className={styles.paperNoise} aria-hidden="true" />
      <div className={styles.progressRail} aria-hidden="true"><span style={{ transform: `scaleY(${Math.max(progress, 0.015)})` }} /></div>

      <header className={styles.nav}>
        <Link className={styles.wordmark} href="#top"><span><Compass size={18} /></span>EXPERIENCE//COMPILER</Link>
        <div className={styles.navMeta}><span>STORY</span><i>→</i><span>EVIDENCE</span><i>→</i><span>WORKSHOP</span></div>
        <a className={styles.navCta} href="#workshop">Choose your path <ArrowRight size={15} /></a>
      </header>

      <section className={`${styles.chapter} ${styles.hero}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><CircleDot size={15} /> AN INTERACTIVE EXPEDITION INTO THE WEB</div>
          <h1>Don’t just read<br /><em>the world.</em></h1>
          <p>Follow Akshar and Gati through a living website. Observe what changed, tell the machine what mattered, and carry the result into any coding AI.</p>
          <a className={styles.primaryCta} href="#false-reading">Scroll into the story <ArrowDown size={19} /></a>
        </div>
        <div className={styles.heroPassport}><span>YOUR EXPEDITION</span><strong>Observe → Judge → Compile</strong><small>One continuous scroll · approximately 90 seconds</small></div>
        <div className={styles.scrollCue}><MousePointer2 size={18} /><span>SCROLL TO MOVE THE WORLD</span><i /></div>
      </section>

      <section className={`${styles.chapter} ${styles.falseReading}`} id="false-reading">
        <div className={styles.mangaSticky}>
          <div className={styles.mangaHeading}><SectionIndex>CHAPTER ONE / THE FALSE READING</SectionIndex><h2>Akshar reaches<br />a living page.</h2></div>
          <div className={styles.mangaPanels}>
            <article className={styles.panelScan}>
              <div className={styles.panelCharacter}><span className={styles.aksharGlyph}><Braces size={31} /></span><i /></div>
              <small>AKSHAR//SCAN</small>
              <h3>Title found.<br />Structure mapped.<br />Reading complete.</h3>
              <div className={styles.scanTicks}><span>TEXT <Check size={14} /></span><span>LINKS <Check size={14} /></span><span>DOM <Check size={14} /></span></div>
            </article>
            <article className={styles.panelMotion}>
              <div className={styles.motionTrail}><span className={styles.gatiGlyph}><Wind size={31} /></span><i /><i /><i /></div>
              <small>BEHIND HIM…</small>
              <h3>The world<br />keeps moving.</h3>
            </article>
            <article className={styles.panelQuestion}>
              <MessageCircle size={27} />
              <p>“What changed when you scrolled?”</p><p>“Why did the meaning arrive later?”</p><p>“What would happen if you touched it?”</p>
            </article>
          </div>
          <blockquote className={styles.archivistLine}><span>You captured the symbols.</span><strong>Then you have read it.<br />You have not understood it.</strong></blockquote>
        </div>
      </section>

      <section className={`${styles.chapter} ${styles.perception}`}>
        <div className={styles.perceptionIntro}><SectionIndex>CHAPTER TWO / FOLLOW THE CHANGE</SectionIndex><h2>Gati turns motion<br />into evidence.</h2><p>No decorative orbit. Every object represents a captured state, an action, or an explicit unknown.</p></div>
        <div className={styles.worldPath}>
          <article><span>S01</span><div data-world="hero"><i /><b /></div><small>HERO</small><strong>The page is waiting.</strong></article>
          <div className={styles.pathAction}><ArrowDown size={20} /><strong>SCROLL +410PX</strong><small>action recorded</small></div>
          <article><span>S02</span><div data-world="approach"><i /><b /></div><small>APPROACH</small><strong>Space changes first.</strong></article>
          <div className={styles.pathAction}><ArrowDown size={20} /><strong>WAIT 240MS</strong><small>time recorded</small></div>
          <article><span>S03</span><div data-world="reveal"><i /><b /></div><small>SEMANTIC REVEAL</small><strong>Meaning arrives.</strong></article>
        </div>
        <div className={styles.familiarDialogue}>
          <article><span className={styles.aksharAvatar}><Braces size={22} /></span><div><small>AKSHAR / STRUCTURE</small><p>“I can preserve the form, hierarchy, and words.”</p></div></article>
          <article><span className={styles.gatiAvatar}><Wind size={22} /></span><div><small>GATI / DYNAMICS</small><p>“I can preserve the order, action, and change.”</p></div></article>
        </div>
      </section>

      <section className={`${styles.chapter} ${styles.memory}`}>
        <div className={styles.memoryHeader}><div><SectionIndex>CHAPTER THREE / CREATIVE MEMORY</SectionIndex><h2>Evidence grows<br />into a genome.</h2></div><p>Observed fact and human taste are different branches. They meet without becoming confused.</p></div>
        <div className={styles.genomeTree}>
          <div className={styles.treeSource}><Eye size={21} /><span>OBSERVED</span><strong>Scroll precedes reveal</strong><code>S01 → A01 → S02</code></div>
          <div className={styles.treeSource}><Heart size={21} /><span>HUMAN JUDGMENT</span><strong>Keep the patient feeling</strong><code>PREFERRED</code></div>
          <div className={styles.treeTrunk}><i /><span><Fingerprint size={23} /></span><strong>EXPERIENCE<br />GENOME</strong></div>
          <div className={styles.treeOutput}><Sparkles size={21} /><span>PROJECT RULE</span><strong>Arrival before language</strong><p>Reinvent the principle. Never clone the source.</p></div>
        </div>
        <div className={styles.unknowns}><div><ScanLine size={22} /><h3>What did we fail to understand?</h3></div><span>FORM <b>GROUNDED</b></span><span>MOTION <b>PARTIAL</b></span><span>POINTER <b>UNRESOLVED</b></span><span>AUDIO <b>UNRESOLVED</b></span></div>
      </section>

      <StoryWorkshop />

      <footer className={styles.footer}><span>EXPERIENCE//COMPILER © 2026</span><span>BUILT FOR THE SCRAPE-VERSE</span><Link href="/lab/drift"><Box size={15} /> SAME-ID DRIFT PROOF</Link></footer>
    </main>
  );
}

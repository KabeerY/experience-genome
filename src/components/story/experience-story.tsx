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
import { type CSSProperties, useEffect, useMemo, useState } from "react";

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

function SectionIndex({ children }: { children: string }) {
  return <span className={styles.sectionIndex}>{children}</span>;
}

function StoryWorkshop() {
  const [mode, setMode] = useState<WorkshopMode>("choose");
  const [reference, setReference] = useState<ReferenceChoice>("archive");
  const [judgment, setJudgment] = useState<Judgment>("unreviewed");
  const [packStatus, setPackStatus] = useState<"idle" | "working" | "done">("idle");
  const [customPrepared, setCustomPrepared] = useState(false);

  const trace = reference === "linear" ? realWebTrace : demoTrace;
  const questStep =
    mode !== "guided"
      ? 0
      : reference === "archive"
        ? 1
        : judgment === "unreviewed"
          ? 2
          : packStatus === "done"
            ? 4
            : 3;

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
          <button onClick={() => setMode("guided")} type="button">
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
        <div className={styles.questShell}>
          <header className={styles.questHeader}>
            <button onClick={() => setMode("choose")} type="button">← Modes</button>
            <div className={styles.questProgress}>
              {["Choose", "Observe", "Judge", "Compile"].map((label, index) => (
                <div className={index + 1 <= questStep ? styles.questDone : ""} key={label}>
                  <span>{index + 1 <= questStep ? <Check size={13} /> : index + 1}</span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
            <span className={styles.zeroCost}><CircleDot size={13} /> VERIFIED REPLAY · 0 LIVE CREDITS</span>
          </header>

          <div className={styles.guideMessage}>
            <span className={styles.gatiAvatar}><Wind size={20} /></span>
            <div>
              <small>GATI / YOUR GUIDE</small>
              <p>
                {reference === "archive"
                  ? "Choose the real-web reference. I’ll show you the movement Akshar preserved."
                  : judgment === "unreviewed"
                    ? "The sequence is observed. Whether it matters is yours to decide."
                    : packStatus === "done"
                      ? "Quest complete. The evidence and your judgment are now portable."
                      : "Good. That judgment can enter the Project Genome without changing the evidence."}
              </p>
            </div>
          </div>

          <div className={styles.questGrid}>
            <aside className={styles.referenceShelf}>
              <span>CHOOSE A CAPTURE</span>
              <button
                className={reference === "archive" ? styles.sourceActive : ""}
                onClick={() => { setReference("archive"); setJudgment("unreviewed"); }}
                type="button"
              >
                <i>A</i><div><small>CONTROLLED / VERIFIED</small><strong>Monsoon Archive</strong><span>3 states · complete contract</span></div><Check size={16} />
              </button>
              <button
                className={reference === "linear" ? styles.sourceActive : ""}
                onClick={() => { setReference("linear"); setJudgment("unreviewed"); }}
                type="button"
              >
                <i>B</i><div><small>REAL WEB / VERIFIED</small><strong>Linear landing page</strong><span>3 regions · sparse capture</span></div><ArrowRight size={16} />
              </button>
              <p>Each card is a persisted Bright Data result. Opening it consumes no additional credit.</p>
            </aside>

            <div className={styles.questEvidence}>
              <div className={styles.evidenceTopline}>
                <div><small>EXPERIENCE TRACE</small><strong>{trace.sourceName}</strong></div>
                <code>{trace.collectorId.slice(0, 7)}…{trace.collectorId.slice(-3)}</code>
              </div>
              <div className={styles.steppingTrace}>
                {trace.states.map((state, index) => (
                  <div className={styles.traceStep} key={state.id}>
                    <article>
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

            <aside className={styles.judgmentCard}>
              <small>GENOME RULE / {reference === "linear" ? "LC01" : "C01"}</small>
              <div className={styles.truthBadges}>
                <span><Eye size={12} /> OBSERVED</span>
                {judgment !== "unreviewed" && <span data-judgment={judgment}><Heart size={12} /> {judgment.toUpperCase()}</span>}
              </div>
              <h3>{reference === "linear" ? "Successive scrolls traverse three semantic regions." : "Spatial arrival precedes semantic reveal."}</h3>
              <p>The machine records what happened. You decide whether this principle belongs in your project.</p>
              <div>
                <button className={judgment === "preferred" ? styles.keepSelected : ""} onClick={() => setJudgment("preferred")} type="button"><Heart size={16} /> Keep</button>
                <button className={judgment === "rejected" ? styles.rejectSelected : ""} onClick={() => setJudgment("rejected")} type="button">Reject</button>
              </div>
              {judgment !== "unreviewed" && (
                <div className={styles.projectRulePreview}>
                  <small>{judgment === "preferred" ? "ENTERS PROJECT GENOME" : "RECORDED AS REJECTED"}</small>
                  <strong>{judgment === "preferred" ? "R05 / Narrative depth markers" : "Source principle excluded"}</strong>
                </div>
              )}
              <button className={styles.packButton} disabled={judgment === "unreviewed" || packStatus === "working"} onClick={compilePack} type="button">
                {packStatus === "done" ? <><Check size={17} /> Experience Pack downloaded</> : packStatus === "working" ? <><Sparkles size={17} /> Weaving pack…</> : <><Download size={17} /> Compile Experience Pack</>}
              </button>
            </aside>
          </div>
          <div className={styles.fullLensLink}><Link href="/studio">Open the complete Genome Lens <ArrowRight size={18} /></Link></div>
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
          <form onSubmit={(event) => { event.preventDefault(); setCustomPrepared(true); }}>
            <label>PUBLIC REFERENCE URL<input placeholder="https://example.com" required type="url" /></label>
            <label>WHAT MATTERED TO YOU?<textarea placeholder="I love how the scene moves before the headline arrives…" required rows={4} /></label>
            <button type="submit"><Play size={17} /> Prepare capture brief</button>
          </form>
          {customPrepared && (
            <div className={styles.customNotice}>
              <Fingerprint size={22} />
              <div><strong>Capture brief ready.</strong><p>Live public collection is operator-gated to protect the remaining 4,993 judge credits. Guided Quest remains zero-cost and fully functional.</p></div>
              <button onClick={() => { setMode("guided"); setReference("linear"); }} type="button">Continue with verified evidence <ArrowRight size={16} /></button>
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

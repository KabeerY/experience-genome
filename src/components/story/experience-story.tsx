"use client";

import {
  ArrowDown,
  ArrowRight,
  Box,
  Braces,
  Check,
  CircleDot,
  Code2,
  Eye,
  Fingerprint,
  Heart,
  Orbit,
  ScanLine,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ArchiveScene } from "./archive-scene";
import styles from "./experience-story.module.css";

function SectionIndex({ children }: { children: string }) {
  return <span className={styles.sectionIndex}>{children}</span>;
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
    <main className={styles.story}>
      <div className={styles.scene} aria-hidden="true">
        <ArchiveScene progress={progress} reducedMotion={reducedMotion} />
      </div>
      <div className={styles.paperNoise} aria-hidden="true" />
      <div className={styles.progressRail} aria-hidden="true">
        <span style={{ transform: `scaleY(${Math.max(progress, 0.015)})` }} />
      </div>

      <header className={styles.nav}>
        <Link className={styles.wordmark} href="#top">
          <span><Orbit size={17} /></span>
          EXPERIENCE//COMPILER
        </Link>
        <div className={styles.navMeta}>
          <span>OBSERVE</span><i>→</i><span>JUDGE</span><i>→</i><span>COMPILE</span>
        </div>
        <Link className={styles.navCta} href="/studio">
          Open Genome Lens <ArrowRight size={14} />
        </Link>
      </header>

      <section className={`${styles.chapter} ${styles.hero}`} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><CircleDot size={13} /> EXPERIENCE IS MORE THAN A SCREENSHOT</div>
          <h1>The web was<span>still moving.</span></h1>
          <p>
            Give it the interactive web you love. Show it what mattered. Compile observed
            experience and human judgment into reusable rules for any coding AI.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryCta} href="/studio">
              Enter Genome Lens <ArrowRight size={17} />
            </Link>
            <a className={styles.secondaryCta} href="#false-reading">
              Experience the story <ArrowDown size={16} />
            </a>
          </div>
        </div>

        <div className={styles.heroEvidence}>
          <div><span>STATE 04</span><strong>HERO</strong></div>
          <i><ArrowDown size={12} /> scroll +410</i>
          <div><span>STATE 05</span><strong>APPROACH</strong></div>
          <i><ArrowDown size={12} /> wait 240ms</i>
          <div><span>STATE 06</span><strong>SEMANTIC REVEAL</strong></div>
        </div>
        <div className={styles.scrollCue}><span /> SCROLL TO OBSERVE</div>
      </section>

      <section className={`${styles.chapter} ${styles.falseReading}`} id="false-reading">
        <div className={styles.chapterCopy}>
          <SectionIndex>ACT I / FALSE READING</SectionIndex>
          <p className={styles.eyebrow}>AKSHAR//SCAN</p>
          <h2>A machine can read every symbol—and miss the world.</h2>
          <div className={styles.scanList}>
            {["TITLE", "TEXT", "STRUCTURE", "LINKS"].map((item, index) => (
              <div key={item}><span>0{index + 1}</span><strong>{item}</strong><Check size={14} /></div>
            ))}
            <div className={styles.scanFailure}><span>05</span><strong>EXPERIENCE</strong><i>UNKNOWN</i></div>
          </div>
        </div>
        <div className={styles.archivePlate}>
          <Image
            alt="Original ancient-future archive concept with Akshar and Gati"
            fill
            priority
            sizes="(max-width: 800px) 92vw, 52vw"
            src="/art/experience-archive-concept.png"
          />
          <div className={styles.plateLabel}>VISUAL MEMORY / 01</div>
        </div>
        <blockquote className={styles.archivistLine}>
          <span>You captured the symbols.</span>
          <span>But the world was still moving.</span>
          <strong>Then you have read it. You have not understood it.</strong>
        </blockquote>
      </section>

      <section className={`${styles.chapter} ${styles.perception}`}>
        <div className={styles.perceptionIntro}>
          <SectionIndex>ACT II / PERCEPTION</SectionIndex>
          <p className={styles.eyebrow}>STATE → ACTION → STATE</p>
          <h2>Observe the experience,<br />not only its remains.</h2>
        </div>
        <div className={styles.familiarGrid}>
          <article className={styles.aksharCard}>
            <div className={styles.familiarOrb}><Braces size={26} /></div>
            <span>COBALT FAMILIAR / STRUCTURE</span>
            <h3>Akshar</h3>
            <p>Finds form, language, hierarchy, symbols and durable records.</p>
            <ul><li>DOM structure</li><li>typographic scale</li><li>semantic regions</li></ul>
          </article>
          <article className={styles.gatiCard}>
            <div className={styles.familiarOrb}><Orbit size={27} /></div>
            <span>EMBER FAMILIAR / DYNAMICS</span>
            <h3>Gati</h3>
            <p>Follows motion, time, transitions, interaction and change.</p>
            <ul><li>scroll response</li><li>temporal order</li><li>action-conditioned delta</li></ul>
          </article>
        </div>
        <div className={styles.traceRibbon}>
          <div><span>00:00</span><strong>HERO</strong><small>initial load</small></div>
          <i><ArrowRight size={16} /><b>scroll +410px</b></i>
          <div><span>00:01.2</span><strong>APPROACH</strong><small>after scroll</small></div>
          <i><ArrowRight size={16} /><b>wait 240ms</b></i>
          <div className={styles.traceReveal}><span>00:01.44</span><strong>REVEAL</strong><small>after wait</small></div>
        </div>
      </section>

      <section className={`${styles.chapter} ${styles.memory}`}>
        <div className={styles.memoryHeader}>
          <div>
            <SectionIndex>ACT III / MEMORY</SectionIndex>
            <p className={styles.eyebrow}>THE EXPERIENCE GENOME</p>
            <h2>Evidence becomes<br />creative memory.</h2>
          </div>
          <p className={styles.memoryLead}>
            Every rule keeps its route back to reality—and the human judgment that made it useful.
          </p>
        </div>

        <article className={styles.ruleInspector}>
          <div className={styles.ruleBasis}>
            <span><Eye size={12} /> OBSERVED</span>
            <span><Heart size={12} fill="currentColor" /> PREFERRED</span>
          </div>
          <div className={styles.ruleStatement}>
            <span>GENOME RULE / C01</span>
            <h3>Spatial arrival precedes semantic reveal.</h3>
            <p>The recorded transition establishes approach before asking the user to read.</p>
          </div>
          <div className={styles.rulePath}>
            <span>EVIDENCE PATH</span>
            <code>S01 → A01 → S02 → A02 → S03 → D01 → D02</code>
          </div>
          <div className={styles.ruleJudgment}>
            <span>HUMAN JUDGMENT</span>
            <strong>KEEP</strong>
            <blockquote>“I love how heavy and patient this reveal feels.”</blockquote>
          </div>
          <div className={styles.ruleArrow}><ArrowRight size={18} /></div>
          <div className={styles.compiledRule}>
            <span>PROJECT RULE / R01</span>
            <strong>Arrival before language</strong>
            <p>Delay semantic labels until the primary spatial event settles.</p>
          </div>
        </article>

        <div className={styles.truthSplit}>
          <p><ScanLine size={19} /><span>The machine records <strong>what happened.</strong></span></p>
          <p><Fingerprint size={19} /><span>The human tells it <strong>what mattered.</strong></span></p>
        </div>

        <article className={styles.unknownContract}>
          <div>
            <span>EXPERIENCE CONTRACT</span>
            <h3>What did we fail to understand?</h3>
          </div>
          <dl>
            <div><dt>FORM</dt><dd data-status="grounded">GROUNDED</dd></div>
            <div><dt>MACRO MOTION</dt><dd data-status="grounded">GROUNDED</dd></div>
            <div><dt>POINTER PHYSICS</dt><dd data-status="partial">PARTIAL</dd></div>
            <div><dt>AUDIO RESPONSE</dt><dd data-status="unresolved">UNRESOLVED</dd></div>
          </dl>
        </article>
      </section>

      <section className={`${styles.chapter} ${styles.compilation}`}>
        <div className={styles.compileIntro}>
          <SectionIndex>ACT IV / COMPILATION</SectionIndex>
          <p className={styles.eyebrow}>THE DREAM FOUNDRY</p>
          <h2>Do not clone the references.<br /><em>Compile what mattered.</em></h2>
          <p>
            Multiple Experience Genomes enter. One original Project Genome leaves—with inherited,
            mutated, rejected and invented rules.
          </p>
        </div>

        <div className={styles.foundry}>
          <div className={styles.sourceGenomes}>
            <article><span>REFERENCE / A</span><strong>Delayed semantic reveal</strong><small>OBSERVED + PREFERRED</small></article>
            <article><span>REFERENCE / B</span><strong>Typographic scale hierarchy</strong><small>OBSERVED + PREFERRED</small></article>
          </div>
          <div className={styles.foundryCore}><Sparkles size={23} /><span>PROJECT<br />GENOME</span></div>
          <div className={styles.projectRules}>
            <article data-kind="inherited"><span>INHERITED</span><strong>Arrival before language</strong></article>
            <article data-kind="mutated"><span>MUTATED</span><strong>Rhythmic withholding</strong></article>
            <article data-kind="rejected"><span>REJECTED</span><strong>No glass-card field</strong></article>
            <article data-kind="invented"><span>INVENTED</span><strong>Orbital capture</strong></article>
          </div>
        </div>

        <div className={styles.finalCta}>
          <div>
            <Box size={22} />
            <span>PORTABLE OUTPUT</span>
            <strong>Experience Pack</strong>
          </div>
          <p>Canonical JSON. Evidence. Traces. Anti-copy rules. Adapters for Codex, Claude, Gemini, Cursor and Copilot.</p>
          <Link href="/studio">Open the compiler <ArrowRight size={18} /></Link>
        </div>

        <footer className={styles.footer}>
          <span>EXPERIENCE//COMPILER © 2026</span>
          <span>BUILT FOR THE SCRAPE-VERSE</span>
          <Link href="/studio"><Code2 size={13} /> GENOME LENS</Link>
        </footer>
      </section>
    </main>
  );
}

"use client";

import { ArrowDown, ArrowRight, Braces, Check, Eye, MousePointer2, Sparkles, Wind } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { ArchiveScene } from "./archive-scene";
import styles from "./cinematic-story.module.css";

const ACTS = ["Read", "Notice", "Understand", "Compile"];

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function sceneFor(progress: number) {
  if (progress < 0.22) return 0;
  if (progress < 0.47) return 1;
  if (progress < 0.73) return 2;
  return 3;
}

export function CinematicStory() {
  const track = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeScene = sceneFor(progress);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = track.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      setProgress(clamp(-rect.top / travel));
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const style = {
    "--story-progress": progress,
    "--cloud-drift": `${progress * 18}vw`,
    "--land-drift": `${progress * -4}vw`,
  } as CSSProperties;

  const openLab = () => document.getElementById("capture-lab")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className={styles.track} id="story" ref={track} style={style}>
      <div className={styles.stage}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <a className={styles.brand} href="#story">
            <span><Eye size={19} /></span>
            <strong>EXPERIENCE<span>{"//"}</span>COMPILER</strong>
          </a>
          <div className={styles.navActs} aria-label="Story progress">
            {ACTS.map((act, index) => (
              <span data-active={index === activeScene} data-past={index < activeScene} key={act}>
                <i>{index < activeScene ? <Check size={10} /> : index + 1}</i>{act}
              </span>
            ))}
          </div>
          <button className={styles.navCta} onClick={openLab} type="button">
            Capture a site <ArrowRight size={16} />
          </button>
        </nav>

        <div className={styles.world} aria-hidden="true">
          <div className={styles.sun}><i /><b /></div>
          <div className={`${styles.cloud} ${styles.cloudOne}`}><i /><i /><i /></div>
          <div className={`${styles.cloud} ${styles.cloudTwo}`}><i /><i /><i /></div>
          <div className={styles.landscape}>
            <Image alt="" fill priority sizes="100vw" src="/art/monsoon-archive-landscape.png" />
          </div>
          <div className={styles.landscapeWash} />
          <div className={styles.sceneCanvas}>
            <ArchiveScene progress={progress} reducedMotion={reducedMotion} />
          </div>
          <div className={styles.terrainLines}><i /><i /><i /><i /></div>
        </div>

        <article className={`${styles.scene} ${styles.opening}`} data-visible={activeScene === 0}>
          <div className={styles.eyebrow}><span>01</span> A machine visits a living page</div>
          <h1>It read<br />everything.<br /><em>Almost.</em></h1>
          <p>Akshar returned with the text, the links, and the structure. The page kept moving after the report ended.</p>
          <div className={styles.openingActions}>
            <button onClick={openLab} type="button">Skip to live capture <ArrowRight size={16} /></button>
            <span><MousePointer2 size={15} /> or keep scrolling</span>
          </div>
        </article>

        <aside className={styles.scanCard} data-visible={activeScene === 0}>
          <header><Braces size={17} /> AKSHAR / PAGE READ</header>
          <div><span>Words</span><b>captured</b><Check size={15} /></div>
          <div><span>Links</span><b>captured</b><Check size={15} /></div>
          <div><span>Structure</span><b>captured</b><Check size={15} /></div>
          <div className={styles.missing}><span>Experience</span><b>unknown</b><i>?</i></div>
          <footer>READ COMPLETE</footer>
        </aside>

        <article className={`${styles.scene} ${styles.challenge}`} data-visible={activeScene === 1}>
          <div className={styles.speaker}>THE ARCHIVIST</div>
          <blockquote>“You captured the symbols.<br /><em>But the world was still moving.</em>”</blockquote>
          <div className={styles.questions}>
            <span>What changed?</span>
            <span>What caused it?</span>
            <span>What would touch reveal?</span>
          </div>
          <p>Then you have read it. You have not understood it.</p>
        </article>

        <article className={`${styles.scene} ${styles.traceScene}`} data-visible={activeScene === 2}>
          <div className={styles.eyebrow}><span>02</span> Gati follows the change</div>
          <h2>A page is a<br /><em>sequence of worlds.</em></h2>
          <div className={styles.traceRibbon}>
            <div><small>ARRIVAL</small><strong>Hero is visible</strong></div>
            <span><Wind size={16} /> scroll</span>
            <div><small>TRANSITION</small><strong>Meaning shifts</strong></div>
            <span><Wind size={16} /> wait</span>
            <div><small>REVEAL</small><strong>New idea lands</strong></div>
          </div>
          <p>Now a rule can point back to what actually happened—not to prose hallucinated from one screenshot.</p>
        </article>

        <article className={`${styles.scene} ${styles.thesis}`} data-visible={activeScene === 3}>
          <div className={styles.eyebrow}><span>03</span> The missing half is yours</div>
          <h2>Evidence becomes<br /><em>creative memory.</em></h2>
          <div className={styles.equation}>
            <span><Eye size={23} /><small>THE MACHINE</small><strong>records what happened</strong></span>
            <b>+</b>
            <span><Sparkles size={23} /><small>THE HUMAN</small><strong>decides what mattered</strong></span>
          </div>
          <p>Compile both into original, reusable rules for Codex, Claude, Gemini, Cursor, or the next agent you use.</p>
          <button className={styles.heroCta} onClick={openLab} type="button">
            Open the live compiler <ArrowRight size={19} />
          </button>
        </article>

        <div className={styles.scrollGuide} data-finished={activeScene === 3}>
          <span><ArrowDown size={15} /></span>
          <div><i style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} /></div>
          <small>{activeScene === 3 ? "THE COMPILER IS BELOW" : `SCROLL · ACT ${activeScene + 1} OF 4`}</small>
        </div>
      </div>
    </section>
  );
}

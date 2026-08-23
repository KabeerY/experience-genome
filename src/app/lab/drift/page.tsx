import type { Metadata } from "next";
import { ArrowRight, Check, ExternalLink, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";

import styles from "./drift.module.css";

export const metadata: Metadata = {
  title: "Drift Lab — Same-ID Healing",
  description: "A controlled, public and repeatable Bright Data self-healing proof.",
};

const collectorId = "c_mt62ojenhz0udx9w5";

export default function DriftLabPage() {
  return (
    <main className={styles.lab}>
      <header className={styles.header}>
        <Link href="/studio">EXPERIENCE//COMPILER</Link>
        <span>CONTROLLED RELIABILITY PROOF</span>
        <Link href="/">Story ↗</Link>
      </header>

      <section className={styles.hero}>
        <div>
          <span>DRIFT LAB / SAME-COLLECTOR-ID</span>
          <h1>Break it clearly.<br /><em>Heal it honestly.</em></h1>
          <p>
            A public synthetic fixture isolates schema drift from the real-web product demo. The
            content contract stays fixed while the DOM representation changes underneath it.
          </p>
        </div>
        <aside>
          <span>BRIGHT DATA BUDGET POLICY</span>
          <strong>Replay by default</strong>
          <p>No live run is triggered by this public interface. Seven of 5,000 record credits were used; 4,993 remain.</p>
        </aside>
      </section>

      <section className={styles.sequence}>
        <article data-stage="baseline">
          <header><span>01 / BASELINE</span><Check size={16} /></header>
          <div className={styles.stageVisual}><i /><i /><i /></div>
          <h2>Known structure</h2>
          <p>The collector reads one payload containing three ordered states from stable baseline selectors.</p>
          <dl>
            <div><dt>Fixture</dt><dd>baseline-v1</dd></div>
            <div><dt>Output</dt><dd>1 record / 3 states</dd></div>
            <div><dt>Capture</dt><dd>d2t…hp3g</dd></div>
          </dl>
          <Link href="/fixture?representation=baseline">Open baseline <ExternalLink size={13} /></Link>
        </article>

        <div className={styles.connector}><ArrowRight size={18} /><span>DOM MUTATION</span></div>

        <article data-stage="broken">
          <header><span>02 / BREAK</span><TriangleAlert size={16} /></header>
          <div className={`${styles.stageVisual} ${styles.brokenVisual}`}><i /><i /><i /></div>
          <h2>Same meaning, moved structure</h2>
          <p>The visible experience remains, but the original selector contract no longer resolves.</p>
          <dl>
            <div><dt>Fixture</dt><dd>shifted-v2</dd></div>
            <div><dt>Expected</dt><dd>old path fails</dd></div>
            <div><dt>Capture</dt><dd>d2t…kaet8</dd></div>
          </dl>
          <Link href="/fixture?representation=shifted">Open mutation <ExternalLink size={13} /></Link>
        </article>

        <div className={styles.connector}><ArrowRight size={18} /><span>SELF-HEAL</span></div>

        <article data-stage="healed">
          <header><span>03 / RECOVER</span><RefreshCw size={16} /></header>
          <div className={`${styles.stageVisual} ${styles.healedVisual}`}><i /><i /><i /></div>
          <h2>Recover the contract</h2>
          <p>Bright Data refactors the development version; the same collector ID returns the three ordered states again.</p>
          <dl>
            <div><dt>Collector</dt><dd>{collectorId}</dd></div>
            <div><dt>Required</dt><dd>same c_*</dd></div>
            <div><dt>Status</dt><dd>exact contract restored</dd></div>
          </dl>
          <span className={styles.verified}><Check size={13} /> Same-ID recovery verified</span>
        </article>
      </section>

      <section className={styles.truthPanel}>
        <div><ShieldCheck size={21} /><span>WHAT THIS PROVES</span></div>
        <p>Repeatable resilience to a controlled representation change while preserving one output contract.</p>
        <div><TriangleAlert size={21} /><span>WHAT IT DOES NOT PROVE</span></div>
        <p>Universal recovery from every arbitrary website change. The real-web observer is evaluated separately.</p>
      </section>

      <section className={styles.proofLedger}>
        <header><span>PROOF LEDGER</span><strong>VERIFIED / RAW JSON IN REPO</strong></header>
        <div><span>Collector creation</span><em>verified</em><code>c_mt62ojenhz0udx9w5</code></div>
        <div><span>Baseline job</span><em>3 states</em><code>d2t1787505924688…</code></div>
        <div><span>Broken job</span><em>empty</em><code>d2t1787505992927…</code></div>
        <div><span>Heal operation</span><em>same ID</em><code>approve + save / c_mt62…w5</code></div>
        <div><span>Recovery job</span><em>3 states</em><code>d2t1787506588795…</code></div>
      </section>
    </main>
  );
}

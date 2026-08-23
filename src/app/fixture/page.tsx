import type { Metadata } from "next";
import Link from "next/link";

import styles from "./fixture.module.css";

export const metadata: Metadata = {
  title: "Controlled Drift Fixture",
  robots: { index: false, follow: false },
};

const states = [
  {
    sequence: 1,
    state: "INSCRIPTION",
    priorAction: "initial_load",
    heading: "A world can be read before it is understood.",
    textExcerpt: "The semantic signal is present, but the experience is dormant.",
    sectionId: "fixture-state-01",
    depth: "0",
    light: "82%",
    reveal: "hidden",
  },
  {
    sequence: 2,
    state: "APPROACH",
    priorAction: "scroll_410px",
    heading: "The world approaches first.",
    textExcerpt: "Spatial movement establishes scale before language arrives.",
    sectionId: "fixture-state-02",
    depth: "-4.2",
    light: "44%",
    reveal: "hidden",
  },
  {
    sequence: 3,
    state: "SEMANTIC_REVEAL",
    priorAction: "wait_240ms",
    heading: "Meaning arrives after scale.",
    textExcerpt: "Only after the spatial event settles does the label become readable.",
    sectionId: "fixture-state-03",
    depth: "-4.2",
    light: "44%",
    reveal: "visible",
  },
] as const;

type FixturePageProps = {
  searchParams: Promise<{ representation?: string }>;
};

export default async function FixturePage({ searchParams }: FixturePageProps) {
  const { representation } = await searchParams;
  const shifted = representation === "shifted";

  return (
    <main className={styles.fixture} data-fixture-version={shifted ? "shifted-v2" : "baseline-v1"}>
      <header className={styles.header}>
        <Link href="/lab/drift">← DRIFT LAB</Link>
        <span>PUBLIC CONTROLLED FIXTURE</span>
        <strong>{shifted ? "SHIFTED / V2" : "BASELINE / V1"}</strong>
      </header>

      <section className={styles.intro}>
        <span>DETERMINISTIC MUTATION SURFACE</span>
        <h1>{shifted ? "The structure moved." : "Arrival before meaning."}</h1>
        <p>
          The visible content and output contract stay identical. Only the document representation
          changes, creating a safe and repeatable same-Collector-ID healing test.
        </p>
        <nav>
          <Link data-active={!shifted} href="/fixture?representation=baseline">Baseline DOM</Link>
          <Link data-active={shifted} href="/fixture?representation=shifted">Shifted DOM</Link>
        </nav>
      </section>

      {!shifted ? (
        <section className={styles.baselineStates} aria-label="Experience states">
          {states.map((item) => (
            <article
              className="experience-state"
              data-prior-action={item.priorAction}
              data-sequence={item.sequence}
              data-state={item.state}
              id={item.sectionId}
              key={item.sectionId}
            >
              <div className="signal-sequence">0{item.sequence}</div>
              <div className="signal-state">{item.state}</div>
              <h2 className="signal-heading">{item.heading}</h2>
              <p className="signal-excerpt">{item.textExcerpt}</p>
              <dl className="signal-metrics">
                <div><dt>depth</dt><dd>{item.depth}</dd></div>
                <div><dt>light</dt><dd>{item.light}</dd></div>
                <div><dt>reveal</dt><dd>{item.reveal}</dd></div>
              </dl>
            </article>
          ))}
        </section>
      ) : (
        <ol className={styles.shiftedLedger} aria-label="Experience states">
          {states.map((item) => (
            <li key={item.sectionId}>
              <header><b>0{item.sequence}</b><em>{item.state}</em></header>
              <div className={styles.shiftedContent}>
                <h2>{item.heading}</h2>
                <p>{item.textExcerpt}</p>
              </div>
              <footer>
                <span>after: {item.priorAction}</span>
                <span>depth {item.depth}</span>
                <span>light {item.light}</span>
                <span>reveal {item.reveal}</span>
              </footer>
            </li>
          ))}
        </ol>
      )}

      <aside className={styles.contract}>
        <span>STABLE OUTPUT CONTRACT</span>
        <code>sequence · state · prior_action · heading · text_excerpt · section_id · url</code>
        <small>No login. No personal data. Public synthetic content only.</small>
      </aside>
    </main>
  );
}

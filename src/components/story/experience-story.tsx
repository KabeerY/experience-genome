"use client";

import { ArrowUpRight, GitBranch } from "lucide-react";

import { LiveWorkshop } from "@/components/workshop/live-workshop";

import { CinematicStory } from "./cinematic-story";
import styles from "./experience-story.module.css";

export function ExperienceStory() {
  return (
    <main className={styles.page}>
      <CinematicStory />
      <LiveWorkshop />
      <footer className={styles.footer}>
        <div>
          <span>EXPERIENCE//COMPILER</span>
          <p>Experience is evidence plus judgment—not pixels copied from a reference.</p>
        </div>
        <a href="https://github.com/KabeerY/experience-genome" rel="noreferrer" target="_blank">
          <GitBranch size={17} /> Source and evidence <ArrowUpRight size={15} />
        </a>
      </footer>
    </main>
  );
}

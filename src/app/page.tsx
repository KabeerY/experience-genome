import type { Metadata } from "next";

import { ExperienceStory } from "@/components/story/experience-story";

export const metadata: Metadata = {
  title: "Experience Compiler — Observe. Judge. Compile.",
  description:
    "Turn observed web experience and human judgment into reusable design rules for any coding AI.",
};

export default function Home() {
  return <ExperienceStory />;
}

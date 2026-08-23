import type { Metadata } from "next";

import { StudioApp } from "@/components/studio/studio-app";

export const metadata: Metadata = {
  title: "Genome Lens — Experience Compiler",
  description: "Inspect evidence, apply human judgment, and compile an Experience Pack.",
};

export default function StudioPage() {
  return <StudioApp />;
}


import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Genome Lens — Experience Compiler",
  description: "Inspect evidence, apply human judgment, and compile an Experience Pack.",
};

export default function StudioPage() {
  redirect("/#capture-lab");
}

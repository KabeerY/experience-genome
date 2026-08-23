import { z } from "zod";

import { evidenceInterpretationSchema } from "@/lib/agents/schema";
import { liveCaptureSchema } from "@/lib/capture/public-contract";
import { humanDecisionSchema, portableProjectGenomeSchema } from "@/lib/compiler/session-pack";

const workshopReferenceSchema = z.object({
  key: z.string().min(1),
  capture: liveCaptureSchema,
  decision: humanDecisionSchema.optional(),
  interpretation: evidenceInterpretationSchema.optional(),
  interpretationStatus: z.enum(["thinking", "ready", "error"]),
  interpretationError: z.string().optional(),
});

export const workshopSessionSchema = z.object({
  version: z.literal("workshop-session@1"),
  references: z.array(workshopReferenceSchema).max(8),
  activeKey: z.string().nullable(),
  projectTitle: z.string(),
  projectBrief: z.string(),
  desiredAffect: z.string(),
  project: portableProjectGenomeSchema.nullable(),
  savedAt: z.string().datetime(),
});

export type WorkshopSession = z.infer<typeof workshopSessionSchema>;

const DATABASE_NAME = "experience-compiler";
const STORE_NAME = "workshop-sessions";
const CURRENT_SESSION_KEY = "current";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadWorkshopSession() {
  const database = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(CURRENT_SESSION_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return workshopSessionSchema.safeParse(value);
  } finally {
    database.close();
  }
}

export async function saveWorkshopSession(session: WorkshopSession) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(workshopSessionSchema.parse(session), CURRENT_SESSION_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function clearWorkshopSession() {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(CURRENT_SESSION_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

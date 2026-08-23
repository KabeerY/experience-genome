import "server-only";

import sharp from "sharp";

import type { LiveCapture } from "@/lib/capture/public-contract";

const FRAME_WIDTH = 420;
const FRAME_HEIGHT = 250;

function jpegBuffer(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Rendered frame is not a data URL.");
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

export async function buildOrderedContactSheet(capture: LiveCapture) {
  const moments = capture.moments.filter((moment) => moment.visual);
  if (!moments.length) return [];

  const frames = await Promise.all(
    moments.map((moment) =>
      sharp(jpegBuffer(moment.visual!.imageDataUrl))
        .resize(FRAME_WIDTH, FRAME_HEIGHT, { fit: "cover", position: "top" })
        .jpeg({ quality: 46, mozjpeg: true })
        .toBuffer(),
    ),
  );
  const width = FRAME_WIDTH * frames.length;
  const labels = Buffer.from(
    `<svg width="${width}" height="${FRAME_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>.label{font:700 18px sans-serif;fill:#fff;letter-spacing:2px}.sub{font:600 11px sans-serif;fill:#fff}</style>
      ${moments.map((moment, index) => {
        const x = index * FRAME_WIDTH + 18;
        const progress = Math.round((moment.visual?.scrollProgress ?? 0) * 100);
        return `<rect x="${index * FRAME_WIDTH}" y="0" width="${FRAME_WIDTH}" height="42" fill="rgba(10,28,30,.72)"/><text x="${x}" y="26" class="label">MOMENT ${moment.order}</text><text x="${x + 130}" y="25" class="sub">${progress}% SCROLL</text>`;
      }).join("")}
    </svg>`,
  );

  const contactSheet = await sharp({
    create: {
      width,
      height: FRAME_HEIGHT,
      channels: 3,
      background: "#173b3c",
    },
  })
    .composite([
      ...frames.map((input, index) => ({ input, left: index * FRAME_WIDTH, top: 0 })),
      { input: labels, left: 0, top: 0 },
    ])
    .jpeg({ quality: 48, mozjpeg: true })
    .toBuffer();

  return [`data:image/jpeg;base64,${contactSheet.toString("base64")}`];
}

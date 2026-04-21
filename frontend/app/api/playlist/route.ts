import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/playlist
 *
 * Scans frontend/public/audio/ for .mp3, .ogg, and .wav files.
 * Returns their public paths so the MusicPlayer can load them.
 * The user adds files manually to public/audio/ and restarts the server.
 */
export async function GET() {
  const audioDir = path.join(process.cwd(), "public", "audio");

  if (!fs.existsSync(audioDir)) {
    return NextResponse.json({ tracks: [] });
  }

  const supported = /\.(mp3|ogg|wav)$/i;
  const files = fs.readdirSync(audioDir).filter((f) => supported.test(f));
  const tracks = files.map((f) => `/audio/${encodeURIComponent(f)}`);

  return NextResponse.json({ tracks });
}

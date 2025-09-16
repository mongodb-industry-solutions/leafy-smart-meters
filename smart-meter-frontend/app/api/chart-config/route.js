import { NextResponse } from 'next/server';

export async function GET() {
  // This runs on the server and has access to runtime secrets
  // Check both possible environment variable names
  const iframeSrc = process.env.APP_IFRAME_SRC || process.env.NEXT_PUBLIC_APP_IFRAME_SRC;

  return NextResponse.json({
    iframeSrc: iframeSrc || null
  });
}
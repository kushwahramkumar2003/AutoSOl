import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      enabled: false,
      message:
        "Nonce-based wallet authentication has been removed. Connect the wallet directly in the UI.",
    },
    { status: 410 }
  );
}

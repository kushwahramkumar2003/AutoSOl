import { NextResponse } from "next/server";

function disabledAuthResponse() {
  return NextResponse.json(
    {
      enabled: false,
      message:
        "Wallet session auth has been removed. Use direct wallet connection from the client instead.",
      providers: [],
    },
    { status: 200 }
  );
}

export function GET() {
  return disabledAuthResponse();
}

export function POST() {
  return disabledAuthResponse();
}

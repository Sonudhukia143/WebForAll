import { NextRequest, NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log("CALLING TRPC FUNCTIONS");

    // Step 1: Parse the request body
    const body = await request.json();
    const { value } = body;

    if (!value) {
      return NextResponse.json({ error: "Missing value" }, { status: 400 });
    }

    console.log(value);

    // Step 2: Send the event to Inngest
    await inngest.send({
      name: "app/ticket.created",
      data: {
        value,
      },
    });

    return NextResponse.json({ message: "Event sent!" });
  } catch (error) {
    console.error("Error in POST /api/users", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

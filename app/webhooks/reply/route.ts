import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";

/**
 * Post to /webhooks/reply?secret=.... with body type: { data: { author: { username: string }, hash: string } }
 * One way to do this is to use a neynar webhook.
 */
export async function POST(req: NextRequest, res: NextResponse) {
  if (!process.env.SIGNER_UUID) {
    throw new Error("Make sure you set SIGNER_UUID in your .env file");
  }

  const webhookSecret = req.nextUrl.searchParams.get("secret");
  if (process.env.WEBHOOK_SECRET !== webhookSecret) {
    return NextResponse.json({ message: "invalid webhook" }, { status: 401 });
  }

  const body = await req.text();
  const hookData = JSON.parse(body);

  const reply = await neynarClient.publishCast(
    process.env.SIGNER_UUID,
    `gm ${hookData.data.author.username}`,
    {
      replyTo: hookData.data.hash,
      //   embeds: [
      //     {
      //       url: frame.link,
      //     },
      //   ],
    }
  );
  console.log("reply:", reply);

  return NextResponse.json({
    message: reply,
  });
}
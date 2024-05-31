import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";
import { Cast as CastV2 } from "@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster/models/cast.js";
import { createHmac } from "crypto";
/**
 * Post to /webhooks/reply?secret=.... with body type: { data: { author: { username: string }, hash: string } }
 * One way to do this is to use a neynar webhook.
 */
export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.text();
  console.log("body:", body);

  const webhookSecret = process.env.NEYNAR_WEBHOOK_SECRET;

  if (
    !process.env.SIGNER_UUID ||
    !process.env.NEYNAR_API_KEY ||
    !webhookSecret
  ) {
    throw new Error(
      "Make sure you set SIGNER_UUID , NEYNAR_API_KEY and  NEYNAR_WEBHOOK_SECRET in your .env file"
    );
  }

  const sig = req.headers.get("X-Neynar-Signature");
  if (!sig) {
    throw new Error("Neynar signature missing from request headers");
  }

  const hmac = createHmac("sha512", webhookSecret);
  hmac.update(body);
  const generatedSignature = hmac.digest("hex");
  console.log("generatedSignature:", generatedSignature);
  console.log("sig:", sig);

  const isValid = generatedSignature === sig;
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  const hookData = (await req.json()) as {
    created_at: number;
    type: "cast.created";
    data: CastV2;
  };

  const reply = await neynarClient.publishCast(
    process.env.SIGNER_UUID,
    `gm ${hookData.data.author.username}`,
    {
      replyTo: hookData.data.hash,
    }
  );
  console.log("reply:", reply);

  return NextResponse.json({
    message: reply,
  });
}

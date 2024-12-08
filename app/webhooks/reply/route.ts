import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";
import { createHmac } from "crypto";
import { Cast } from "@neynar/nodejs-sdk/build/api";
import { generateAIResponse } from "@/app/ai";
/**
 * Post to /webhooks/reply?secret=.... with body type: { data: { author: { username: string }, hash: string } }
 * One way to do this is to use a neynar webhook.
 */
export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.text();

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

  const isValid = generatedSignature === sig;
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  const hookData = JSON.parse(body) as {
    created_at: number;
    type: "cast.created";
    data: Cast;
  };

  const text = await generateAIResponse(hookData.data);

  const reply = await neynarClient.publishCast({
    signerUuid: process.env.SIGNER_UUID,
    text: text,
    parent: hookData.data.hash,
  });
  console.log("reply:", reply);

  return NextResponse.json({
    message: reply,
  });
}

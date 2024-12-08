import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, tool } from "ai";
import { Cast, EmbedUrl } from "@neynar/nodejs-sdk/build/api";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const basePrompt = `
This is a template.
You should add some prompts here for the bot.
REPLACE ME.
`;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const model = anthropic("claude-3-5-sonnet-20241022");

export async function generateAIResponse(cast: Cast) {
  //   const castImage = cast.embeds
  //     .filter((embed): embed is EmbedUrl => "url" in embed)
  //     .find((embed) =>
  //       (embed as any).metadata?.content_type?.startsWith("image/")
  //     )?.url;
  const tools = {};

  try {
    const {
      text: aiResponse,
      steps,
      ...rest
    } = await generateText({
      model: model,
      prompt: `
      ${basePrompt}

      User message:
      ${cast.text}
      `,
      // m.data.body.text must contain <= 320 bytes and be a valid UTF8 string.
      // an emoji can take more than 1 byte, so we round down for care
      maxTokens: 300,
      maxRetries: 3,
      maxSteps: 2,
      tools: tools,
    });

    return aiResponse;
  } catch (err) {
    console.error(err);
    const { text: aiResponse } = await generateText({
      model: model,
      prompt: `
      ${basePrompt}

      Rewrite this error message so the user can understand it: ${err}`,
      // m.data.body.text must contain <= 320 bytes and be a valid UTF8 string.
      // an emoji can take more than 1 byte, so we round down for care
      maxTokens: 300,
      maxRetries: 3,
      maxSteps: 2,
    });

    return aiResponse;
  }
}

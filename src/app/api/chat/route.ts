import { NextResponse } from "next/server";
import { getGoogleAuthClient } from "@/utils/googleAuth";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

async function streamVertexAI(messages: ChatMessage[], model: string) {
  const endpoint = process.env.GOOGLE_CLOUD_ENDPOINT;
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_REGION;

  const auth = await getGoogleAuthClient();
  const client = await auth.getClient();
  const tokenResult = await client.getAccessToken();
  const url = `https://${endpoint}/v1beta1/projects/${project}/locations/${location}/endpoints/openapi/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenResult.token}`,
    },
    body: JSON.stringify({
      model: model,
      stream: true,
      max_tokens: 512,
      temperature: 0,
      top_p: 0.95,
      messages,
    }),
  });

  return response;
}

async function streamOllama(messages: ChatMessage[], model: string) {
  const response = await fetch(`${process.env.OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  return response;
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { model, messages, provider } = body;

    const response =
      provider === "vertex-ai"
        ? await streamVertexAI(messages, model)
        : await streamOllama(messages, model);

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${responseBody}`,
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            if (line.startsWith("data: ")) {
              const jsonString = line.slice(6); // Remove "data: " prefix
              if (jsonString === "[DONE]") continue;

              const parsedData = JSON.parse(jsonString);

              if (provider === "vertex-ai") {
                // Transform Vertex AI format to match OpenAI format
                const transformedData = {
                  id: parsedData.id || "chatcmpl-" + Date.now(),
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: model,
                  choices: [
                    {
                      delta: {
                        content: parsedData.choices?.[0]?.delta?.content || "",
                      },
                      index: 0,
                      finish_reason:
                        parsedData.choices?.[0]?.finish_reason || null,
                    },
                  ],
                };
                controller.enqueue(
                  encoder.encode(JSON.stringify(transformedData) + "\n"),
                );
              } else {
                // For Ollama, pass through the original format
                controller.enqueue(
                  encoder.encode(JSON.stringify(parsedData) + "\n"),
                );
              }
            }
          } catch (error) {
            console.error("Error parsing line:", line, error);
            continue;
          }
        }
      },
    });

    const readableStream = response.body!.pipeThrough(transformStream);

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return NextResponse.json(
      { error: `Failed to fetch response: ${error}` },
      { status: 500 },
    );
  }
}

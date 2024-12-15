import { NextResponse } from "next/server";
import { getGoogleAuthClient } from "@/utils/googleAuth";

export interface ModelOption {
  id: string;
  name: string;
  provider: "ollama" | "vertex-ai";
  modelId: string;
  description: string;
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

async function streamVertexAI(messages: ChatMessage[], model: string) {
  const endpoint = process.env.GOOGLE_CLOUD_ENDPOINT;
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_REGION;

  const auth = await getGoogleAuthClient();
  const client = await auth.getClient();
  const tokenResult = await client.getAccessToken();
  const url = `https://${endpoint}/v1beta1/projects/${project}/locations/${location}/endpoints/openapi/chat/completions`;

  return fetch(url, {
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
          if (!line.trim()) continue;

          try {
            if (provider === "vertex-ai") {
              // Remove 'data: ' prefix and handle [DONE] case
              const cleanLine = line.replace(/^data: /, "").trim();
              if (cleanLine === "[DONE]") continue;

              const parsed = JSON.parse(cleanLine);

              // Extract text from Vertex AI response structure
              if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                const transformedData = {
                  message: {
                    content: parsed.candidates[0].content.parts[0].text,
                  },
                };
                controller.enqueue(
                  encoder.encode(JSON.stringify(transformedData) + "\n"),
                );
              }
            } else {
              // Handle Ollama response directly
              const parsed = JSON.parse(line);
              controller.enqueue(encoder.encode(JSON.stringify(parsed) + "\n"));
            }
          } catch (error) {
            console.warn("Error processing line:", line, error);
            continue;
          }
        }
      },
    });

    return new Response(response.body?.pipeThrough(transformStream), {
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

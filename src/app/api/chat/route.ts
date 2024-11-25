import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { model, messages } = body;

    const response = await fetch(`${process.env.OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true, // Enable streaming
      }),
    });

    // Create a TransformStream for handling the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        // Ollama sends data in the format: "event: data\ndata: {...}\n\n"
        const lines = text.split("\n");
        const parsedLines = lines
          .filter((line) => line.startsWith("data: "))
          .map((line) => JSON.parse(line.slice(6)));

        for (const parsedLine of parsedLines) {
          controller.enqueue(encoder.encode(JSON.stringify(parsedLine) + "\n"));
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
    return NextResponse.json(
      { error: `Failed to fetch response: ${error}` },
      { status: 500 },
    );
  }
}

export const runtime = "edge"; // Enable edge runtime for better streaming support

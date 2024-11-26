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
        stream: true,
      }),
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);

        const lines = text.split("\n");

        const parsedLines = lines
          .filter((line) => line.trim() !== "")
          .map((line) => {
            return JSON.parse(line);
          });

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
    console.error("Error occurred:", error);
    return NextResponse.json(
      { error: `Failed to fetch response: ${error}` },
      { status: 500 },
    );
  }
}

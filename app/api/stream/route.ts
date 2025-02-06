import { SchemaStream } from "schema-stream";
import {
  CompleteObjectSchema,
  type CompleteObject,
  type StreamResponse,
} from "@/app/types/stream";

// Create a sample complete object
const completeObject: CompleteObject = {
  message:
    "This is a very long string that demonstrates streaming capabilities. It contains lots of information that will be chunked and validated. We're using schema-stream to ensure type safety while processing this data in chunks. This shows how we can handle large JSON objects efficiently.",
  count: 42,
  isEnabled: true,
  status: "ACTIVE",
  message2:
    "This is a message that is long so that I can see how the stream handles it. It should be a lot longer than the other message, so that we can see how the stream handles it.",
};

export async function GET() {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Track paths and completion
  const requiredFields = new Set([
    "message",
    "count",
    "isEnabled",
    "status",
    "message2",
  ]);
  const completedFields = new Set<string>();
  let activePath: (string | number)[] = [];
  let completedPaths: (string | number)[][] = [];

  // Create parser with path tracking
  const parser = new SchemaStream(CompleteObjectSchema, {
    typeDefaults: {
      string: "",
      number: 0,
      boolean: false,
    },
    onKeyComplete: ({ activePath: current, completedPaths: completed }) => {
      activePath = current.filter((p): p is string | number => p !== undefined);
      completedPaths = completed
        .map((path) =>
          path.filter((p): p is string | number => p !== undefined)
        )
        .filter((path) => path.length > 0);

      // Track field completion
      completedPaths.forEach((path) => {
        if (path.length === 1 && typeof path[0] === "string") {
          completedFields.add(path[0]);
        }
      });
    },
  });

  // Create streams pipeline
  const stream = new ReadableStream({
    start(controller) {
      const jsonString = JSON.stringify(completeObject);
      let position = 0;
      const chunkSize = 5; // Characters per chunk

      function emitChunk() {
        if (position >= jsonString.length) {
          controller.close();
          return;
        }

        // Get next chunk
        const chunk = jsonString.slice(position, position + chunkSize);
        controller.enqueue(encoder.encode(chunk));
        position += chunkSize;
        setTimeout(emitChunk, 50);
      }

      emitChunk();
    },
  })
    .pipeThrough(parser.parse({ handleUnescapedNewLines: true }))
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          try {
            const result = JSON.parse(decoder.decode(chunk));
            const response: StreamResponse = {
              chunk: "",
              bytesProcessed: chunk.length,
              timestamp: Date.now(),
              data: result,
              _meta: {
                _activePath: activePath,
                _completedPaths: completedPaths,
                _isComplete: Array.from(requiredFields).every((field) =>
                  completedFields.has(field)
                ),
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(response) + "\n"));
          } catch (e) {
            console.error("Error in transform:", e);
          }
        },
      })
    );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

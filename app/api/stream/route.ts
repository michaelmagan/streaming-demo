import { z } from "zod";

const SimpleSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.string(),
});

type SimpleType = z.infer<typeof SimpleSchema>;

async function* mockDataStream(): AsyncGenerator<SimpleType> {
  const finalObject = {
    title: "Building a Streaming Demo",
    description:
      "This is a demonstration of streaming JSON with multiple fields updating progressively.",
    status: "Initializing... In Progress... Complete!",
  };

  let currentTitle = "";
  let currentDesc = "";
  let currentStatus = "Initializing";

  // Stream title
  for (const char of finalObject.title) {
    currentTitle += char;
    yield { title: currentTitle, description: "", status: currentStatus };
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Stream description
  currentStatus = "In Progress";
  for (const char of finalObject.description) {
    currentDesc += char;
    yield {
      title: currentTitle,
      description: currentDesc,
      status: currentStatus,
    };
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Final state
  yield { title: currentTitle, description: currentDesc, status: "Complete!" };
}

export async function GET() {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of mockDataStream()) {
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

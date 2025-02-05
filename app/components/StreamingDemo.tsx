"use client";

import { useState } from "react";

type StreamData = {
  title: string;
  description: string;
  status: string;
};

export function StreamingDemo() {
  const [data, setData] = useState<StreamData>({
    title: "",
    description: "",
    status: "",
  });
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async () => {
    setIsStreaming(true);
    setData({ title: "", description: "", status: "" });

    try {
      const response = await fetch("/api/stream");
      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const newData = JSON.parse(line) as StreamData;
              setData(newData);
            } catch (e) {
              console.error("Failed to parse JSON:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <button
          onClick={startStream}
          disabled={isStreaming}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isStreaming ? "Streaming..." : "Start Stream"}
        </button>

        <div className="p-4 border rounded-lg min-h-[200px] bg-gray-50 space-y-4">
          <div>
            <h2 className="font-bold text-gray-700">Status:</h2>
            <p className="font-mono text-blue-600">
              {data.status || "Waiting..."}
            </p>
          </div>
          <div>
            <h2 className="font-bold text-gray-700">Title:</h2>
            <p className="font-mono">{data.title || "Waiting..."}</p>
          </div>
          <div>
            <h2 className="font-bold text-gray-700">Description:</h2>
            <p className="font-mono">{data.description || "Waiting..."}</p>
          </div>
          <div>
            <h2 className="font-bold text-gray-700">Raw JSON:</h2>
            <pre className="font-mono bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

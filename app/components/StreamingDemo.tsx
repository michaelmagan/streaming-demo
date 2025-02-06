"use client";

import { useState } from "react";
import type { StreamResponse, CompleteObject } from "@/app/types/stream";

export function StreamingDemo() {
  const [streamData, setStreamData] = useState<StreamResponse>({
    chunk: "",
    bytesProcessed: 0,
    timestamp: Date.now(),
  });
  const [partialData, setPartialData] = useState<Partial<CompleteObject>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [accumulatedJson, setAccumulatedJson] = useState("");

  const startStream = async () => {
    setIsStreaming(true);
    setStreamData({
      chunk: "",
      bytesProcessed: 0,
      timestamp: Date.now(),
    });
    setPartialData({});
    setAccumulatedJson("");

    try {
      const response = await fetch("/api/stream");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let lastProcessedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunks to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");

        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || "";

        // Process each complete line
        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const newData = JSON.parse(line) as StreamResponse;

            // Only update if we have new data
            if (
              newData.bytesProcessed > lastProcessedLength ||
              newData._meta?._isComplete
            ) {
              lastProcessedLength = newData.bytesProcessed;
              setStreamData(newData);

              if (newData.chunk) {
                setAccumulatedJson((prev) => prev + newData.chunk);
              }

              if (newData.data) {
                setPartialData((current) => ({
                  ...current,
                  ...newData.data,
                }));
              }

              // If stream is complete, break the loop
              if (newData._meta?._isComplete) {
                reader.cancel();
                break;
              }
            }
          } catch (e) {
            console.error("Failed to parse JSON line:", e);
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const renderValue = (key: keyof CompleteObject, value: any) => {
    const isActive = streamData._meta?._activePath?.includes(key);
    const isComplete = streamData._meta?._completedPaths?.some((path) =>
      path.includes(key)
    );

    let displayValue = "...";
    if (value !== undefined) {
      displayValue = typeof value === "string" ? `"${value}"` : String(value);
    }

    return (
      <div className="flex items-center gap-2">
        <span
          className={`w-4 text-center ${
            isActive
              ? "text-blue-500"
              : isComplete
              ? "text-green-500"
              : "text-gray-400"
          }`}
        >
          {isActive ? "→" : isComplete ? "✓" : "·"}
        </span>
        <span className="text-purple-600">{key}</span>:{" "}
        <span className={isComplete ? "text-black" : "text-gray-400"}>
          {displayValue}
        </span>
        {key !== "status" && ","}
      </div>
    );
  };

  const renderValueCard = (key: keyof CompleteObject, value: any) => {
    const isActive = streamData._meta?._activePath?.includes(key);
    const isComplete = streamData._meta?._completedPaths?.some((path) =>
      path.includes(key)
    );

    let displayValue = "Loading...";
    if (value !== undefined) {
      displayValue = typeof value === "string" ? value : String(value);
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">{key}</span>
          <span
            className={`w-6 h-6 flex items-center justify-center rounded-full ${
              isActive
                ? "bg-blue-100 text-blue-500"
                : isComplete
                ? "bg-green-100 text-green-500"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {isActive ? "→" : isComplete ? "✓" : "·"}
          </span>
        </div>
        <div
          className={`text-sm ${
            isComplete ? "text-gray-900" : "text-gray-400"
          } break-words`}
        >
          {displayValue}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={startStream}
            disabled={isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isStreaming ? "Streaming..." : "Generate Object"}
          </button>
          {streamData._meta?._isComplete && (
            <span className="text-green-500 font-medium">Stream Complete</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Value Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Live Values</h3>
            <div className="space-y-4">
              {renderValueCard("message", partialData.message)}
              {renderValueCard("count", partialData.count)}
              {renderValueCard("isEnabled", partialData.isEnabled)}
              {renderValueCard("status", partialData.status)}
              {renderValueCard("message2", partialData.message2)}
            </div>
          </div>

          {/* Column 2: JSON Object View */}
          <div className="font-mono bg-gray-100 p-4 rounded-lg whitespace-pre overflow-auto">
            <div className="text-sm text-gray-500 mb-2">Parsed Object:</div>
            {"{"}
            <div className="pl-4">
              {renderValue("message", partialData.message)}
              {renderValue("count", partialData.count)}
              {renderValue("isEnabled", partialData.isEnabled)}
              {renderValue("status", partialData.status)}
              {renderValue("message2", partialData.message2)}
            </div>
            {"}"}
          </div>

          {/* Column 3: Raw JSON Stream */}
          <div className="font-mono bg-gray-100 p-4 rounded-lg overflow-auto">
            <div className="text-sm text-gray-500 mb-2">Raw JSON Stream:</div>
            <div className="text-xs break-all">{accumulatedJson}</div>
            {streamData._meta && streamData._meta._activePath.length > 0 && (
              <div className="text-gray-500 text-sm mt-2 border-t pt-2">
                Processing: {streamData._meta._activePath.join(".")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { z } from "zod";

// Define our status enum
export const StatusEnum = z.enum(["ACTIVE", "PENDING", "COMPLETED", "FAILED"]);
export type Status = z.infer<typeof StatusEnum>;

// Define our complete object schema
export const CompleteObjectSchema = z.object({
  message: z.string().default(""),
  count: z.number().default(0),
  isEnabled: z.boolean().default(false),
  message2: z.string().default(""),
  status: StatusEnum.default("PENDING"),
});

export type CompleteObject = z.infer<typeof CompleteObjectSchema>;

// Define the streaming response type
export type StreamResponse = {
  // Current chunk info
  chunk: string;
  bytesProcessed: number;
  timestamp: number;

  // Schema stream metadata
  _meta?: {
    _activePath: (string | number)[];
    _completedPaths: (string | number)[][];
    _isComplete?: boolean;
  };

  // Parsed data (when available)
  data?: CompleteObject;

  // Error handling
  error?: string;
};

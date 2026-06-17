import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isDebugMode } from "@/lib/runtime-mode";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      errorPayload(error.status, error.message, error),
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "Invalid request", issues: error.issues },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json(
    errorPayload(500, "Internal server error", error),
    { status: 500 }
  );
}

function errorPayload(status: number, message: string, error: unknown) {
  if (!isDebugMode()) {
    return { message };
  }

  return {
    message,
    status,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : String(error),
  };
}

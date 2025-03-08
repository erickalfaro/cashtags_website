import { NextResponse } from "next/server";

export function handleApiError(error: unknown, message: string): NextResponse {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

// Define the context type with optional ticker
interface ApiContext {
  params: Promise<{ ticker?: string }>;
}

// Type for the handler with a guaranteed ticker
interface ValidatedContext {
  params: Promise<{ ticker: string }>;
}

export function withValidation(
  handler: (req: Request, ctx: ValidatedContext) => Promise<NextResponse>
) {
  return async (req: Request, ctx: ApiContext) => {
    const params = await ctx.params; // Resolve the Promise
    const { ticker } = params;
    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
    }
    // Narrow the type by casting ctx to ValidatedContext since ticker is now guaranteed
    const validatedCtx = { ...ctx, params: Promise.resolve({ ticker }) } as ValidatedContext;
    return handler(req, validatedCtx);
  };
}
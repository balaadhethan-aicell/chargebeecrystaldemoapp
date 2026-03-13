export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options?: { code?: string; status?: number; details?: Record<string, unknown> }) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "app_error";
    this.status = options?.status ?? 500;
    this.details = options?.details;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message
      },
      status: error.status
    };
  }

  return {
    error: {
      code: "internal_error",
      message: "Something went wrong while loading Monetization Twin."
    },
    status: 500
  };
}

/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formatting and HTTP status codes across all API routes.
 * All responses follow a structured format for better error handling on the client.
 */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  details?: Record<string, unknown>;
  code?: string;
}

/**
 * Success response with data
 *
 * @param data - The data to return
 * @param statusCode - HTTP status code (default: 200)
 * @returns Response object
 *
 * @example
 * ```typescript
 * return success({ id: 'calendar-123', title: 'My Calendar' })
 * ```
 */
export function success<T>(data: T, statusCode: number = 200): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      data,
    } as ApiResponse<T>),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * Error response with message and optional details
 *
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param details - Additional error details
 * @returns Response object
 *
 * @example
 * ```typescript
 * return error('Invalid input', 400, { field: 'email' })
 * ```
 */
export function error(
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      message,
      details,
    } as ApiResponse),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * 401 Unauthorized response
 *
 * @param message - Custom message (optional)
 * @returns Response object
 */
export function unauthorized(message?: string): Response {
  return error(message ?? "Unauthorized", 401, { code: "UNAUTHORIZED" });
}

/**
 * 403 Forbidden response
 *
 * @param message - Custom message (optional)
 * @returns Response object
 */
export function forbidden(message?: string): Response {
  return error(message ?? "Forbidden", 403, { code: "FORBIDDEN" });
}

/**
 * 404 Not Found response
 *
 * @param message - Custom message (optional)
 * @returns Response object
 */
export function notFound(message?: string): Response {
  return error(message ?? "Not found", 404, { code: "NOT_FOUND" });
}

/**
 * 400 Bad Request response
 *
 * @param message - Error message
 * @param errors - Validation errors
 * @returns Response object
 *
 * @example
 * ```typescript
 * return badRequest('Validation failed', {
 *   email: ['Invalid email format'],
 *   password: ['Must be at least 8 characters']
 * })
 * ```
 */
export function badRequest(
  message?: string,
  errors?: Record<string, string[] | string>,
): Response {
  return error(message ?? "Bad request", 400, { errors, code: "BAD_REQUEST" });
}

/**
 * 500 Internal Server Error response
 *
 * @param message - Error message
 * @returns Response object
 */
export function internalError(message?: string): Response {
  return error(message ?? "Internal server error", 500, { code: "INTERNAL_ERROR" });
}

/**
 * Wrapper to handle errors in async route handlers
 *
 * @param handler - Async function that returns data
 * @returns Response object
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withErrorHandling(async () => {
 *     const data = await fetchSomething()
 *     return data
 *   })
 * }
 * ```
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
): Promise<Response> {
  try {
    const result = await handler();
    return success(result);
  } catch (err) {
    console.error("API error:", err);

    if (err instanceof Error) {
      return internalError(err.message);
    }

    return internalError("An unexpected error occurred");
  }
}

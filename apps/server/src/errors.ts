import type { ServerErrorCode, ServerMessage } from '@neon/shared';

export interface ServerError extends Error {
  readonly code: ServerErrorCode;
}

export function createServerError(code: ServerErrorCode, message: string): ServerError {
  const error = new Error(message) as ServerError;
  Object.defineProperty(error, 'code', {
    value: code,
    enumerable: true,
    configurable: false,
    writable: false,
  });
  return error;
}

export function toServerErrorEvent(error: unknown): Extract<ServerMessage, { type: 'error' }>['payload'] {
  if (isServerError(error)) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return {
    code: 'invalid_message',
    message: error instanceof Error ? error.message : 'Unknown server error.',
  };
}

function isServerError(error: unknown): error is ServerError {
  return error instanceof Error && typeof (error as { code?: unknown }).code === 'string';
}

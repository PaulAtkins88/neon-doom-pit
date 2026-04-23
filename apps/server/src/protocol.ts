import type { ClientMessage } from '@neon/shared';
import type { RawData } from 'ws';
import { createServerError } from './errors';

export function parseClientMessage(payload: RawData): ClientMessage {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload.toString());
  } catch {
    throw createServerError('invalid_message', 'Message payload must be valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || typeof (parsed as { type?: unknown }).type !== 'string') {
    throw createServerError('invalid_message', 'Message payload must include a type field.');
  }

  return parsed as ClientMessage;
}

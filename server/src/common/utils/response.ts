import type { Response } from 'express';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const envelope: SuccessEnvelope<T> = { success: true, data };
  res.status(statusCode).json(envelope);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  fields?: Record<string, string[]>
): void {
  const hasFields = fields !== undefined && Object.keys(fields).length > 0;
  const envelope: ErrorEnvelope = {
    success: false,
    error: {
      message,
      ...(hasFields ? { fields } : {}),
    },
  };
  res.status(statusCode).json(envelope);
}

import { ERROR_CODES } from "../constants.js";

function createCodeError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

async function readRequestText(request, maxBytes) {
  if (!request.body) {
    return "";
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") || "", 10);

  if (Number.isFinite(contentLength) && maxBytes > 0 && contentLength > maxBytes) {
    throw createCodeError(ERROR_CODES.BODY_TOO_LARGE);
  }

  if (!maxBytes) {
    return request.text();
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw createCodeError(ERROR_CODES.BODY_TOO_LARGE);
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

export async function parseJsonSafely(request, maxBytes = 0) {
  const text = await readRequestText(request, maxBytes);

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export function parseMessageId(url, body) {
  return toOptionalString(url.searchParams.get("id") || body?.id).trim();
}

export function toPositiveInt(rawValue, fallback, min, max) {
  const parsed = Number.parseInt(rawValue ?? `${fallback}`, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

export function formatMessage(item) {
  return {
    id: item.id,
    text: item.text,
    ts: item.ts,
    receivedAt: item.receivedAt,
    reply: item.reply,
    status: item.status,
    pulled: item.pulled === 1
  };
}

export function isErrorCode(error, code) {
  return error?.code === code;
}

export function toOptionalString(value) {
  if (value == null) {
    return "";
  }

  return typeof value === "string" ? value : `${value}`;
}

export function ensureMaxLength(value, maxLength, code) {
  if (value.length > maxLength) {
    throw createCodeError(code);
  }

  return value;
}

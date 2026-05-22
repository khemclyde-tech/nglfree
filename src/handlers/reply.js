import { isAdmin } from "../auth.js";
import { ERROR_CODES, HTTP_STATUS, MESSAGE_STATUS, REQUEST_LIMITS } from "../constants.js";
import { setMessageReply } from "../data/messages.js";
import { jsonResponse, unauthorizedResponse } from "../http.js";
import { ensureMaxLength, isErrorCode, parseJsonSafely, parseMessageId, toOptionalString } from "./shared.js";

export async function handleReply(request, env, url) {
  if (!isAdmin(request, env)) {
    return unauthorizedResponse();
  }

  let body;

  try {
    body = await parseJsonSafely(request, REQUEST_LIMITS.MAX_JSON_BODY_BYTES);
  } catch (error) {
    if (isErrorCode(error, ERROR_CODES.BODY_TOO_LARGE)) {
      return jsonResponse({ ok: false, error: ERROR_CODES.BODY_TOO_LARGE }, HTTP_STATUS.PAYLOAD_TOO_LARGE);
    }

    return jsonResponse({ ok: false, error: ERROR_CODES.BAD_JSON }, HTTP_STATUS.BAD_REQUEST);
  }

  const id = parseMessageId(url, body);
  if (!id) {
    return jsonResponse({ ok: false, error: ERROR_CODES.BAD_ID }, HTTP_STATUS.BAD_REQUEST);
  }

  const reply = toOptionalString(body?.reply).trim();

  if (!reply) {
    return jsonResponse({ ok: false, error: ERROR_CODES.REPLY_MISSING }, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    ensureMaxLength(reply, REQUEST_LIMITS.MAX_REPLY_LENGTH, ERROR_CODES.REPLY_TOO_LONG);
  } catch (error) {
    if (isErrorCode(error, ERROR_CODES.REPLY_TOO_LONG)) {
      return jsonResponse({ ok: false, error: ERROR_CODES.REPLY_TOO_LONG }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    throw error;
  }

  try {
    await setMessageReply(env.DB, { id, reply });
    return jsonResponse({
      ok: true,
      id,
      reply,
      status: MESSAGE_STATUS.REPLIED
    });
  } catch {
    return jsonResponse({ ok: false, error: ERROR_CODES.UPDATE_FAILED }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

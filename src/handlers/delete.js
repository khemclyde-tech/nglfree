import { isAdmin } from "../auth.js";
import { ERROR_CODES, HTTP_STATUS, REQUEST_LIMITS } from "../constants.js";
import { deleteMessageById } from "../data/messages.js";
import { jsonResponse, unauthorizedResponse } from "../http.js";
import { isErrorCode, parseJsonSafely, parseMessageId } from "./shared.js";

export async function handleDelete(request, env, url) {
  if (!isAdmin(request, env)) {
    return unauthorizedResponse();
  }

  let body = null;

  try {
    body = await parseJsonSafely(request, REQUEST_LIMITS.MAX_JSON_BODY_BYTES);
  } catch (error) {
    if (isErrorCode(error, ERROR_CODES.BODY_TOO_LARGE)) {
      return jsonResponse({ ok: false, error: ERROR_CODES.BODY_TOO_LARGE }, HTTP_STATUS.PAYLOAD_TOO_LARGE);
    }

    body = null;
  }

  const id = parseMessageId(url, body);

  if (!id) {
    return jsonResponse({ ok: false, error: ERROR_CODES.BAD_ID }, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    await deleteMessageById(env.DB, id);
    return jsonResponse({ ok: true, id });
  } catch {
    return jsonResponse({ ok: false, error: ERROR_CODES.DELETE_FAILED }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

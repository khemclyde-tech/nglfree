import { ERROR_CODES, HTTP_STATUS, MESSAGE_RULES, REQUEST_LIMITS } from "../constants.js";
import { jsonResponse } from "../http.js";
import { verifyTurnstile } from "../turnstile.js";
import { insertMessage } from "../data/messages.js";
import { notifyMessageReceived } from "../services/mail-proxy.js";
import { ensureMaxLength, isErrorCode, parseJsonSafely, toOptionalString } from "./shared.js";

export async function handleSend(request, env, ctx) {
  let body;

  try {
    body = await parseJsonSafely(request, REQUEST_LIMITS.MAX_JSON_BODY_BYTES);
  } catch (error) {
    if (isErrorCode(error, ERROR_CODES.BODY_TOO_LARGE)) {
      return jsonResponse({ ok: false, error: ERROR_CODES.BODY_TOO_LARGE }, HTTP_STATUS.PAYLOAD_TOO_LARGE);
    }

    return jsonResponse({ ok: false, error: ERROR_CODES.BAD_JSON }, HTTP_STATUS.BAD_REQUEST);
  }

  const text = toOptionalString(body?.text).trim();
  const token = toOptionalString(body?.token);

  if (!text) return jsonResponse({ ok: false, error: ERROR_CODES.TEXT_MISSING }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  if (text.length > MESSAGE_RULES.MAX_TEXT_LENGTH) return jsonResponse({ ok: false, error: ERROR_CODES.TEXT_TOO_LONG }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  if (!token) return jsonResponse({ ok: false, error: ERROR_CODES.MISSING_TOKEN }, HTTP_STATUS.BAD_REQUEST);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const verifyResult = await verifyTurnstile({
    secret: env.TURNSTILE_SECRET || "",
    token,
    ip
  });

  if (!verifyResult?.success) {
    return jsonResponse({
      ok: false,
      error: ERROR_CODES.TURNSTILE_FAILED,
      code: verifyResult?.["error-codes"] || []
    }, HTTP_STATUS.FORBIDDEN);
  }

  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const id = `${MESSAGE_RULES.ID_PREFIX}:${now}:${crypto.randomUUID().slice(0, 8)}`;
  let meta;

  try {
    meta = {
      ua: ensureMaxLength(toOptionalString(body?.meta?.ua), REQUEST_LIMITS.MAX_META_UA_LENGTH, ERROR_CODES.META_TOO_LONG),
      ref: ensureMaxLength(toOptionalString(body?.meta?.ref), REQUEST_LIMITS.MAX_META_REF_LENGTH, ERROR_CODES.META_TOO_LONG),
      tz: ensureMaxLength(toOptionalString(body?.meta?.tz), REQUEST_LIMITS.MAX_META_TZ_LENGTH, ERROR_CODES.META_TOO_LONG),
      lang: ensureMaxLength(toOptionalString(body?.meta?.lang), REQUEST_LIMITS.MAX_META_LANG_LENGTH, ERROR_CODES.META_TOO_LONG),
      colo: request.cf?.colo || "",
      country: request.cf?.country || ""
    };
  } catch (error) {
    if (isErrorCode(error, ERROR_CODES.META_TOO_LONG)) {
      return jsonResponse({ ok: false, error: ERROR_CODES.META_TOO_LONG }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    throw error;
  }

  try {
    await insertMessage(env.DB, {
      id,
      text,
      ts: now,
      createdAt,
      ip,
      meta,
      receivedAt: createdAt
    });

    const notifyTask = notifyMessageReceived(env, {
      id,
      createdAt,
      reviewUrl: new URL("/review", request.url).toString()
    }).catch((error) => {
      console.error("MAIL_PROXY notify failed", error);
    });

    if (ctx?.waitUntil) {
      ctx.waitUntil(notifyTask);
    } else {
      await notifyTask;
    }

    return jsonResponse({ ok: true, id, createdAt }, HTTP_STATUS.CREATED);
  } catch {
    return jsonResponse({ ok: false, error: ERROR_CODES.DB_INSERT_FAILED }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

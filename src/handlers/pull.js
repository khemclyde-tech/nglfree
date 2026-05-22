import { isAdmin } from "../auth.js";
import { ERROR_CODES, HTTP_STATUS, PAGINATION, PULL_MODES } from "../constants.js";
import { countMessages, listMessages, markMessagesPulled } from "../data/messages.js";
import { jsonResponse, unauthorizedResponse } from "../http.js";
import { formatMessage, toPositiveInt } from "./shared.js";

export async function handlePull(request, env, url) {
  if (!isAdmin(request, env)) {
    return unauthorizedResponse();
  }

  const limit = toPositiveInt(url.searchParams.get("limit"), PAGINATION.DEFAULT_LIMIT, PAGINATION.MIN_LIMIT, PAGINATION.MAX_LIMIT);
  const offset = toPositiveInt(url.searchParams.get("offset"), PAGINATION.DEFAULT_OFFSET, PAGINATION.DEFAULT_OFFSET, PAGINATION.MAX_OFFSET);
  const mode = url.searchParams.get("mode") || PULL_MODES.UNREPLIED;

  try {
    const results = await listMessages(env.DB, { mode, limit, offset });
    const ids = results.map((item) => item.id);

    if (ids.length) {
      await markMessagesPulled(env.DB, ids);
    }

    const items = results.map((item) => formatMessage({
      ...item,
      pulled: 1
    }));
    const total = await countMessages(env.DB, mode);

    return jsonResponse({
      items,
      nextOffset: offset + items.length,
      total
    });
  } catch {
    return jsonResponse({ ok: false, error: ERROR_CODES.DB_QUERY_FAILED }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

export const RESPONSE_HEADERS = {
  JSON_CONTENT_TYPE: "application/json; charset=utf-8",
  TEXT_CONTENT_TYPE: "text/plain; charset=utf-8",
  NO_STORE_CACHE_CONTROL: "no-store"
};

export const SECURITY_HEADERS = {
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=()",
  "content-security-policy": "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; base-uri 'none'; frame-ancestors 'none'"
};

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-admin-token",
  "Access-Control-Max-Age": "86400"
};

export const MESSAGE_RULES = {
  MAX_TEXT_LENGTH: 500,
  ID_PREFIX: "msg"
};

export const REQUEST_LIMITS = {
  MAX_JSON_BODY_BYTES: 8 * 1024,
  MAX_META_UA_LENGTH: 512,
  MAX_META_REF_LENGTH: 2048,
  MAX_META_TZ_LENGTH: 100,
  MAX_META_LANG_LENGTH: 64,
  MAX_REPLY_LENGTH: 2000
};

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MIN_LIMIT: 1,
  MAX_LIMIT: 200,
  DEFAULT_OFFSET: 0,
  MAX_OFFSET: Number.MAX_SAFE_INTEGER
};

export const MESSAGE_STATUS = {
  NEW: "new",
  REPLIED: "replied"
};

export const PULL_MODES = {
  ALL: "all",
  UNREPLIED: "unreplied"
};

export const ERROR_CODES = {
  BAD_JSON: "bad_json",
  BODY_TOO_LARGE: "body_too_large",
  TEXT_MISSING: "text_missing",
  TEXT_TOO_LONG: "text_too_long",
  META_TOO_LONG: "meta_too_long",
  MISSING_TOKEN: "missing_token",
  TURNSTILE_FAILED: "turnstile_failed",
  DB_INSERT_FAILED: "db_insert_failed",
  BAD_ID: "bad_id",
  REPLY_MISSING: "reply_missing",
  REPLY_TOO_LONG: "reply_too_long",
  DELETE_FAILED: "delete_failed",
  UPDATE_FAILED: "update_failed",
  DB_QUERY_FAILED: "db_query_failed"
};

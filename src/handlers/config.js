import { jsonResponse } from "../http.js";

export function handleConfig(_request, env) {
  return jsonResponse({
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || ""
  });
}

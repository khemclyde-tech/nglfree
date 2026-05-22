import { CORS_HEADERS, HTTP_STATUS, RESPONSE_HEADERS, SECURITY_HEADERS } from "./constants.js";

export function addSecurityHeaders(response) {
  const nextResponse = new Response(response.body, response);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    nextResponse.headers.set(key, value);
  }

  return nextResponse;
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return addSecurityHeaders(new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": RESPONSE_HEADERS.JSON_CONTENT_TYPE,
      "cache-control": RESPONSE_HEADERS.NO_STORE_CACHE_CONTROL,
      ...extraHeaders
    }
  }));
}

export function textResponse(body, status = 200, extraHeaders = {}) {
  return addSecurityHeaders(new Response(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": RESPONSE_HEADERS.TEXT_CONTENT_TYPE,
      "cache-control": RESPONSE_HEADERS.NO_STORE_CACHE_CONTROL,
      ...extraHeaders
    }
  }));
}

export function unauthorizedResponse() {
  return textResponse("unauthorized", HTTP_STATUS.UNAUTHORIZED);
}

export function optionsResponse() {
  return addSecurityHeaders(new Response(null, {
    status: HTTP_STATUS.NO_CONTENT,
    headers: CORS_HEADERS
  }));
}

// nglfree - 匿名消息服务 Worker
// API 端点：/api/config, /api/profile, /api/send, /api/pull, /api/reply, /api/delete

import { addSecurityHeaders, optionsResponse } from "./http.js";
import { handleConfig } from "./handlers/config.js";
import { handleProfile } from "./handlers/profile.js";
import { handleSend } from "./handlers/send.js";
import { handleDelete } from "./handlers/delete.js";
import { handlePull } from "./handlers/pull.js";
import { handleReply } from "./handlers/reply.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return optionsResponse();
    }

    if (path === "/api/config" && method === "GET") {
      return handleConfig(request, env);
    }

    if (path === "/api/profile" && method === "GET") {
      return handleProfile(request, env);
    }

    if (path === "/api/send" && method === "POST") {
      return handleSend(request, env, ctx);
    }

    if (path === "/api/delete" && (method === "POST" || method === "DELETE")) {
      return handleDelete(request, env, url);
    }

    if (path === "/api/pull" && method === "GET") {
      return handlePull(request, env, url);
    }

    if (path === "/api/reply" && (method === "POST" || method === "PUT")) {
      return handleReply(request, env, url);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return addSecurityHeaders(assetResponse);
  }
};

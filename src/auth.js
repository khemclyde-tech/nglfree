export function isAdmin(request, env) {
  const headerToken = request.headers.get("x-admin-token") || "";
  const bearerToken = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const token = headerToken || bearerToken || "";

  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

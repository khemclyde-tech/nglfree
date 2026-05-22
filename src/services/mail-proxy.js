const REQUIRED_NOTIFY_TOPIC = "NGL-Free";
const DEFAULT_NOTIFY_PRIORITY = "3";
const NOTIFY_ENDPOINT = "https://mail-proxy/notify";

function toTrimmedString(value) {
  return value == null ? "" : String(value).trim();
}

function buildNotifyMessage({ id, createdAt, reviewUrl }) {
  const lines = [
    "收到一条新留言待审核",
    `ID: ${id}`,
    `时间: ${createdAt}`
  ];

  if (reviewUrl) {
    lines.push(`审核: ${reviewUrl}`);
  }

  return lines.join("\n");
}

export async function notifyMessageReceived(env, { id, createdAt, reviewUrl }) {
  if (!env?.MAIL_PROXY || typeof env.MAIL_PROXY.fetch !== "function") {
    return;
  }

  const token = await env?.MAIL_PROXY_TOKEN?.get?.();
  const priority = toTrimmedString(env?.MAIL_PROXY_NOTIFY_PRIORITY) || DEFAULT_NOTIFY_PRIORITY;

  if (!token) {
    return;
  }

  const payload = {
    topic: REQUIRED_NOTIFY_TOPIC,
    title: "NGL Free 新留言",
    message: buildNotifyMessage({ id, createdAt, reviewUrl }),
    priority
  };

  const request = new Request(NOTIFY_ENDPOINT, {
    method: "POST",
    headers: {
      "X-Auth-Token": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const response = await env.MAIL_PROXY.fetch(request);

  if (!response.ok) {
    throw new Error(`mail-proxy notify failed: ${response.status}`);
  }
}

import { jsonResponse } from "../http.js";

export function handleProfile(_request, env) {
  return jsonResponse({
    avatarUrl: env.PROFILE_AVATAR_URL || "/avatar.jpg",
    nickname: env.PROFILE_NICKNAME || "@your_name",
    prompt: env.PROFILE_PROMPT || "说点什么..."
  });
}

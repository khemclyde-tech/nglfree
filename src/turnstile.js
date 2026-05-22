export async function verifyTurnstile({ secret, token, ip }) {
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip
      })
    });

    return await response.json();
  } catch {
    return { success: false, "error-codes": [] };
  }
}

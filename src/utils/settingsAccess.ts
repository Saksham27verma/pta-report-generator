function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function randomSalt(bytes = 16): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

export async function hashSettingsPassword(password: string, salt: string): Promise<string> {
  // Simple salted hash. This is not a replacement for server-side auth, but is enough
  // to prevent casual access when a shared login/device is used.
  return sha256Hex(`${salt}:${password}`)
}



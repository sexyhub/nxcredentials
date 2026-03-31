import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENC_PREFIX = "enc:v1:";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is required");
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
  return buf;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const parts = [iv, tag, encrypted].map((b) => b.toString("base64")).join(":");
  return ENC_PREFIX + parts;
}

export function decrypt(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value;
  const inner = value.slice(ENC_PREFIX.length);
  const parts = inner.split(":");
  if (parts.length !== 3) return value;
  const [ivB64, tagB64, ctB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);
  return decipher.update(ct).toString("utf8") + decipher.final("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

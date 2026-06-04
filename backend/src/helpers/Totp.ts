import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

const base32Encode = (buffer: Buffer): string => {
  let bits = "";
  let output = "";

  buffer.forEach(byte => {
    bits += byte.toString(2).padStart(8, "0");
  });

  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return output;
};

const base32Decode = (secret: string): Buffer => {
  const cleanSecret = secret
    .replace(/=+$/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
  let bits = "";

  cleanSecret.split("").forEach(char => {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid base32 secret");
    bits += index.toString(2).padStart(5, "0");
  });

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
};

export const generateTotpSecret = (): string => base32Encode(randomBytes(20));

export const generateTotpCode = (
  secret: string,
  timestamp = Date.now()
): string => {
  const counter = Math.floor(timestamp / 1000 / STEP_SECONDS);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] % 16;
  const binary = hmac.readUInt32BE(offset) % 0x80000000;

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
};

export const verifyTotpCode = (secret: string, code: string): boolean => {
  const cleanCode = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return false;

  return [-1, 0, 1].some(window => {
    const expected = generateTotpCode(
      secret,
      Date.now() + window * STEP_SECONDS * 1000
    );
    return timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected));
  });
};

export const createTotpUri = (
  issuer: string,
  account: string,
  secret: string
): string =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    account
  )}?secret=${secret}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;

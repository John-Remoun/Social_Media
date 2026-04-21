import crypto from "crypto";
import { BadRequestException } from "../../exceptions";
import { ENC_BYTE, ENC_IV_LENGTH } from "../../../config/config";

export const generateEncryption = async (
  plaintext: string,
): Promise<string> => {
  if (!plaintext) {
    throw new BadRequestException("No data to encrypt");
  }

  if (!ENC_BYTE) {
    throw new BadRequestException("Encryption key not configured");
  }

  const iv = crypto.randomBytes(ENC_IV_LENGTH);

  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_BYTE, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

export const generateDecryption = async (
  cipherText: string,
): Promise<string> => {
  if (!cipherText) {
    throw new BadRequestException("No cipher text provided");
  }

  if (!ENC_BYTE) {
    throw new BadRequestException("Encryption key not configured");
  }

  const parts = cipherText.split(":");

  if (parts.length !== 2) {
    throw new BadRequestException("Invalid encryption format");
  }

  const ivHex = parts[0];
  const encrypted = parts[1];

  if (!ivHex || !encrypted) {
    throw new BadRequestException("Invalid encryption parts");
  }

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", ENC_BYTE, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

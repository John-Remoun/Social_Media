"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDecryption = exports.generateEncryption = void 0;
const crypto_1 = __importDefault(require("crypto"));
const exceptions_1 = require("../../exceptions");
const config_1 = require("../../../config/config");
const generateEncryption = async (plaintext) => {
    if (!plaintext) {
        throw new exceptions_1.BadRequestException("No data to encrypt");
    }
    if (!config_1.ENC_BYTE) {
        throw new exceptions_1.BadRequestException("Encryption key not configured");
    }
    const iv = crypto_1.default.randomBytes(config_1.ENC_IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", config_1.ENC_BYTE, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
};
exports.generateEncryption = generateEncryption;
const generateDecryption = async (cipherText) => {
    if (!cipherText) {
        throw new exceptions_1.BadRequestException("No cipher text provided");
    }
    if (!config_1.ENC_BYTE) {
        throw new exceptions_1.BadRequestException("Encryption key not configured");
    }
    const parts = cipherText.split(":");
    if (parts.length !== 2) {
        throw new exceptions_1.BadRequestException("Invalid encryption format");
    }
    const ivHex = parts[0];
    const encrypted = parts[1];
    if (!ivHex || !encrypted) {
        throw new exceptions_1.BadRequestException("Invalid encryption parts");
    }
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", config_1.ENC_BYTE, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
exports.generateDecryption = generateDecryption;

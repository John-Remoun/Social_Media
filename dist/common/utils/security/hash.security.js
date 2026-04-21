"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generateHash = void 0;
const config_1 = require("../../../config/config");
const bcrypt_1 = require("bcrypt");
const generateHash = async ({ plaintext, salt = config_1.SALT_ROUND, }) => {
    return await (0, bcrypt_1.hash)(plaintext, salt);
};
exports.generateHash = generateHash;
const compareHash = async ({ plaintext, cipherText, }) => {
    return await (0, bcrypt_1.compare)(plaintext, cipherText);
};
exports.compareHash = compareHash;

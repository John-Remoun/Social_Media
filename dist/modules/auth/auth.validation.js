"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = exports.loginSchema = exports.confirmEmailSchema = exports.reSendConfirmEmailSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.reSendConfirmEmailSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidation.email,
    }),
};
exports.confirmEmailSchema = {
    body: exports.reSendConfirmEmailSchema.body.safeExtend({
        otp: validation_1.generalValidation.otp,
    }),
};
exports.loginSchema = {
    body: exports.reSendConfirmEmailSchema.body.safeExtend({
        password: validation_1.generalValidation.password,
    }),
};
exports.signupSchema = {
    body: exports.loginSchema.body.safeExtend({
        username: validation_1.generalValidation.username,
        confirmPassword: validation_1.generalValidation.confirmPassword,
        phone: validation_1.generalValidation.phone.optional(),
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        error: "password mismatch with confirm password",
    }),
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidation = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
exports.generalValidation = {
    email: zod_1.z.email(),
    password: zod_1.z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\w).{8,16}$/, {
        error: "weak password",
    }),
    username: zod_1.z
        .string({ error: "username is mandatory" })
        .min(2, { error: "min is 2 char" })
        .max(25, { error: "max is 25" }),
    firstName: zod_1.z
        .string()
        .min(2, { message: "firstName must be at least 2 characters" })
        .max(50),
    lastName: zod_1.z
        .string()
        .min(2, { message: "lastName must be at least 2 characters" })
        .max(50),
    confirmPassword: zod_1.z.string(),
    phone: zod_1.z.string({ error: "phone is required" }).regex(/^(00201|\+201|01)((0|1|2|5)|\d{8})$/, {
        error: "invalid phone number",
    }),
    otp: zod_1.z.string().regex(/^\d{6}$/),
    id: zod_1.z.string().refine((value) => mongoose_1.Types.ObjectId.isValid(value), {
        message: "Invalid ObjectId format",
    }),
};

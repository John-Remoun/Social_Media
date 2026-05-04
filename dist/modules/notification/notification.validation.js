"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationSchema = exports.markReadSchema = exports.getNotificationSchema = exports.updateNotificationSchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
const Enums_1 = require("../../common/Enums");
exports.createNotificationSchema = {
    body: zod_1.z
        .strictObject({
        title: zod_1.z.string().min(1),
        message: zod_1.z.string().min(1),
        audience: zod_1.z.nativeEnum(Enums_1.NotificationAudienceEnum).optional(),
        recipientId: validation_1.generalValidation.id.optional(),
        type: zod_1.z.nativeEnum(Enums_1.NotificationTypeEnum).optional(),
    })
        .refine((value) => value.audience === Enums_1.NotificationAudienceEnum.ALL ||
        Boolean(value.recipientId), {
        message: "recipientId is required when audience is USER",
    }),
};
exports.updateNotificationSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidation.id }),
    body: zod_1.z
        .strictObject({
        title: zod_1.z.string().min(1).optional(),
        message: zod_1.z.string().min(1).optional(),
        isRead: zod_1.z.boolean().optional(),
    })
        .refine((value) => Object.keys(value).length > 0, {
        message: "Please provide a field to update",
    }),
};
exports.getNotificationSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidation.id }),
};
exports.markReadSchema = {
    params: zod_1.z.strictObject({ id: validation_1.generalValidation.id }),
};
exports.deleteNotificationSchema = exports.getNotificationSchema;

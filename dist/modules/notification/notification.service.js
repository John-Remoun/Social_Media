"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationAppService = void 0;
const mongoose_1 = require("mongoose");
const exceptions_1 = require("../../common/exceptions");
const repository_1 = require("../../DB/repository");
const Enums_1 = require("../../common/Enums");
const services_1 = require("../../common/services");
const redis_service_1 = require("../../common/services/redis.service");
class NotificationAppService {
    notificationRepository;
    userRepository;
    constructor() {
        this.notificationRepository = new repository_1.NotificationRepository();
        this.userRepository = new repository_1.UserRepository();
    }
    async createNotification(data, user) {
        if (user.role !== "ADMIN") {
            throw new exceptions_1.ForbiddenException("Only admin can create notifications");
        }
        const audience = data.audience ?? Enums_1.NotificationAudienceEnum.USER;
        const type = data.type ?? Enums_1.NotificationTypeEnum.SYSTEM;
        if (audience === Enums_1.NotificationAudienceEnum.USER && !data.recipientId) {
            throw new exceptions_1.BadRequestException("recipientId is required when audience is USER");
        }
        const payload = {
            title: data.title,
            message: data.message,
            senderId: user._id,
            type,
            audience,
            relatedEntityType: "USER",
            isRead: false,
        };
        if (audience === Enums_1.NotificationAudienceEnum.ALL) {
            return this._broadcastToAll(payload, data);
        }
        return this._sendToOne(payload, data);
    }
    async listNotifications(user) {
        return this.notificationRepository.find({
            filter: { recipientId: user._id, deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: -1 },
            },
        });
    }
    async getNotificationById(id, user) {
        const notification = await this.notificationRepository.findOne({
            filter: { _id: id, recipientId: user._id, deletedAt: null },
        });
        if (!notification) {
            throw new exceptions_1.NotFoundException("Notification not found");
        }
        return notification;
    }
    async markAsRead(id, user) {
        const notification = await this.notificationRepository.findOne({
            filter: { _id: id, recipientId: user._id, deletedAt: null },
        });
        if (!notification) {
            throw new exceptions_1.NotFoundException("Notification not found");
        }
        if (notification.isRead) {
            return notification;
        }
        const updated = await this.notificationRepository.updateOne({
            filter: { _id: id },
            update: { isRead: true, readAt: new Date() },
        });
        if (!updated) {
            throw new exceptions_1.NotFoundException("Failed to update notification");
        }
        return updated;
    }
    async markAllAsRead(user) {
        const result = await this.notificationRepository.updateMany({
            filter: { recipientId: user._id, isRead: false, deletedAt: null },
            update: { isRead: true, readAt: new Date() },
        });
        return { updated: result.modifiedCount };
    }
    async updateNotification(id, data, user) {
        if (user.role !== "ADMIN") {
            throw new exceptions_1.ForbiddenException("Only admin can update notifications");
        }
        const updated = await this.notificationRepository.updateOne({
            filter: { _id: id },
            update: { $set: data },
        });
        if (!updated) {
            throw new exceptions_1.NotFoundException("Notification not found");
        }
        return updated;
    }
    async deleteNotification(id, user) {
        if (user.role !== "ADMIN") {
            throw new exceptions_1.ForbiddenException("Only admin can delete notifications");
        }
        await this.notificationRepository.deleteOne({ filter: { _id: id } });
    }
    async softDeleteNotification(id, user) {
        const notification = await this.notificationRepository.findOne({
            filter: { _id: id, recipientId: user._id, deletedAt: null },
        });
        if (!notification) {
            throw new exceptions_1.NotFoundException("Notification not found");
        }
        await this.notificationRepository.updateOne({
            filter: { _id: id },
            update: { deletedAt: new Date() },
        });
    }
    async unreadCount(user) {
        const count = await this.notificationRepository.countDocuments({
            filter: { recipientId: user._id, isRead: false, deletedAt: null },
        });
        return { count };
    }
    async _broadcastToAll(payload, data) {
        const users = await this.userRepository.find({
            filter: { deletedAt: null },
            projection: { _id: 1 },
        });
        if (!users.length) {
            throw new exceptions_1.NotFoundException("No users available to notify");
        }
        const docs = users.map((recipient) => ({
            ...payload,
            recipientId: recipient._id,
        }));
        await this.notificationRepository.create({ data: docs });
        const tokens = await redis_service_1.redisService.getAllFCMTokens();
        if (tokens.length) {
            await services_1.notificationService.sendNotifications({
                tokens,
                data: { title: data.title, body: data.message },
            });
        }
        return docs;
    }
    async _sendToOne(payload, data) {
        const recipientId = String(data.recipientId);
        const recipient = await this.userRepository.findOne({
            filter: { _id: recipientId, deletedAt: null },
        });
        if (!recipient) {
            throw new exceptions_1.NotFoundException("Recipient not found");
        }
        const doc = await this.notificationRepository.createOne({
            data: {
                ...payload,
                recipientId: new mongoose_1.Types.ObjectId(recipientId),
            },
        });
        const tokens = await redis_service_1.redisService.getFCMs(data.recipientId);
        if (tokens.length) {
            await services_1.notificationService.sendNotifications({
                tokens,
                data: { title: data.title, body: data.message },
            });
        }
        return [doc];
    }
}
exports.NotificationAppService = NotificationAppService;
exports.default = new NotificationAppService();

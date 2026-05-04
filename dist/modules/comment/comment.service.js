"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const mongoose_1 = require("mongoose");
const exceptions_1 = require("../../common/exceptions");
const repository_1 = require("../../DB/repository");
const Enums_1 = require("../../common/Enums");
class CommentService {
    commentRepository;
    postRepository;
    notificationRepository;
    constructor() {
        this.commentRepository = new repository_1.CommentRepository();
        this.postRepository = new repository_1.PostRepository();
        this.notificationRepository = new repository_1.NotificationRepository();
    }
    async createComment(data, user) {
        const post = await this.postRepository.findById({ id: data.postId });
        if (!post || post.deletedAt) {
            throw new exceptions_1.NotFoundException("Post not found");
        }
        const payload = {
            postId: new mongoose_1.Types.ObjectId(data.postId),
            content: data.content,
            attachments: data.attachments || [],
            createdBy: user._id,
            replies: [],
        };
        const comment = await this.commentRepository.createOne({ data: payload });
        const recipientId = post.createdBy.toString();
        if (recipientId !== user._id.toString()) {
            await this.notificationRepository.createOne({
                data: {
                    title: "Someone commented on your post",
                    message: data.content,
                    senderId: user._id,
                    recipientId: new mongoose_1.Types.ObjectId(recipientId),
                    type: Enums_1.NotificationTypeEnum.COMMENT,
                    relatedEntityId: comment._id,
                    relatedEntityType: "POST",
                    isRead: false,
                },
            });
        }
        return comment;
    }
    async replyToComment(parentCommentId, data, user) {
        const parentComment = await this.commentRepository.findById({
            id: parentCommentId,
        });
        if (!parentComment || parentComment.deletedAt) {
            throw new exceptions_1.NotFoundException("Parent comment not found");
        }
        const replyData = {
            createdBy: user._id,
            content: data.content,
            attachments: data.attachments || [],
            reactions: [],
        };
        const updatedComment = await this.commentRepository.updateOne({
            filter: { _id: parentCommentId },
            update: {
                $push: { replies: replyData },
            },
        });
        if (!updatedComment) {
            throw new exceptions_1.NotFoundException("Failed to add reply");
        }
        const recipientId = parentComment.createdBy.toString();
        if (recipientId !== user._id.toString()) {
            await this.notificationRepository.createOne({
                data: {
                    title: "Someone replied to your comment",
                    message: data.content,
                    senderId: user._id,
                    recipientId: new mongoose_1.Types.ObjectId(recipientId),
                    type: Enums_1.NotificationTypeEnum.REPLY,
                    relatedEntityId: parentComment._id,
                    relatedEntityType: "COMMENT",
                    isRead: false,
                },
            });
        }
        return (await this.commentRepository.findById({
            id: parentCommentId,
            options: {
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                    {
                        path: "replies.createdBy",
                        select: "firstName lastName profilePicture",
                    },
                ],
            },
        }));
    }
    async listPostComments(postId) {
        return this.commentRepository.find({
            filter: { postId, deletedAt: null },
            options: {
                lean: true,
                sort: { createdAt: 1 },
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                    {
                        path: "replies.createdBy",
                        select: "firstName lastName profilePicture",
                    },
                ],
            },
        });
    }
    async getCommentById(id) {
        const comment = await this.commentRepository.findById({
            id,
            options: {
                populate: [
                    { path: "createdBy", select: "firstName lastName profilePicture" },
                    {
                        path: "replies.createdBy",
                        select: "firstName lastName profilePicture",
                    },
                ],
            },
        });
        if (!comment || comment.deletedAt) {
            throw new exceptions_1.NotFoundException("Comment not found");
        }
        return comment;
    }
    async updateComment(id, data, user) {
        const comment = await this.commentRepository.findById({ id });
        if (!comment || comment.deletedAt) {
            throw new exceptions_1.NotFoundException("Comment not found");
        }
        const ownerId = comment.createdBy.toString();
        if (ownerId !== user._id.toString()) {
            throw new exceptions_1.ForbiddenException("You cannot update this comment");
        }
        const updated = await this.commentRepository.updateOne({
            filter: { _id: id },
            update: {
                $set: {
                    ...data,
                },
            },
        });
        if (!updated) {
            throw new exceptions_1.NotFoundException("Failed to update comment");
        }
        return updated;
    }
    async deleteComment(id, user) {
        const comment = await this.commentRepository.findById({ id });
        if (!comment || comment.deletedAt) {
            throw new exceptions_1.NotFoundException("Comment not found");
        }
        const ownerId = comment.createdBy.toString();
        if (ownerId !== user._id.toString()) {
            throw new exceptions_1.ForbiddenException("You cannot delete this comment");
        }
        const deleted = await this.commentRepository.updateOne({
            filter: { _id: id },
            update: { deletedAt: new Date() },
        });
        if (!deleted) {
            throw new exceptions_1.NotFoundException("Failed to delete comment");
        }
        return deleted;
    }
    async reaction(id, data, user) {
        const comment = await this.commentRepository.findById({ id });
        if (!comment || comment.deletedAt) {
            throw new exceptions_1.NotFoundException("Comment not found");
        }
        const existingReactions = (comment.reactions || []);
        const emoji = data.emoji;
        const existingIndex = existingReactions.findIndex((item) => item.emoji === emoji && item.userId.toString() === user._id.toString());
        const reactions = [...existingReactions];
        if (existingIndex >= 0) {
            reactions.splice(existingIndex, 1);
        }
        else {
            reactions.push({ emoji, userId: user._id });
        }
        const updated = await this.commentRepository.updateOne({
            filter: { _id: id },
            update: { reactions },
        });
        if (!updated) {
            throw new exceptions_1.NotFoundException("Failed to update reaction");
        }
        return updated;
    }
}
exports.CommentService = CommentService;
exports.default = new CommentService();

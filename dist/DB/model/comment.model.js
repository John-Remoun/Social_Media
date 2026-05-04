"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const replySchema = new mongoose_1.Schema({
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    reactions: [
        {
            emoji: { type: String, required: true },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
        },
    ],
}, { timestamps: true });
const commentSchema = new mongoose_1.Schema({
    postId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    reactions: [
        {
            emoji: { type: String, required: true },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
        },
    ],
    replies: [replySchema],
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_COMMENTS",
});
commentSchema.pre(["find", "findOne", "findOneAndUpdate"], function () {
    if (this.getOptions().withDeleted)
        return;
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
    }
});
commentSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], { document: false, query: true }, async function () {
    if (this.getOptions().withDeleted)
        return;
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
    }
});
const DELETE_OPS = ["deleteOne", "deleteMany"];
DELETE_OPS.forEach((op) => {
    commentSchema.pre(op, { document: false, query: true }, async function () {
        if (this.getOptions().hardDelete)
            return;
        const filter = this.getFilter();
        const target = await this.model.findOne({ ...filter, deletedAt: null });
        if (!target) {
            this.setQuery({ _id: null });
            return;
        }
        await this.model.updateOne({ _id: target._id }, { $set: { deletedAt: new Date() } });
        this.setQuery({ _id: null });
    });
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);

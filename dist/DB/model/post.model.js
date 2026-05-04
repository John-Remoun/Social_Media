"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = require("mongoose");
const Enums_1 = require("../../common/Enums");
const postSchema = new mongoose_1.Schema({
    folderId: { type: String, required: true },
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    availability: {
        type: Number,
        enum: Enums_1.AvailabilityEnum,
        default: Enums_1.AvailabilityEnum.PUBLIC,
    },
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    reactions: [
        {
            emoji: { type: String },
            userId: { type: mongoose_1.Types.ObjectId, ref: "User" },
        },
    ],
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_POSTS",
});
async function cascadeSoftDeletePostRelated(post) {
    const now = new Date();
    await post
        .model("Comment")
        .updateMany({ postId: post._id, deletedAt: null }, { $set: { deletedAt: now } });
    await post
        .model("Notification")
        .updateMany({ "metadata.referenceId": post._id, deletedAt: null }, { $set: { deletedAt: now } });
}
postSchema.pre(["find", "findOne", "findOneAndUpdate"], function () {
    if (!this.getFilter) {
        return;
    }
    const filter = this.getFilter();
    if (filter?.deletedAt === undefined) {
        this.setQuery({ ...filter, deletedAt: null });
    }
});
postSchema.pre("save", async function () {
    if (this.isModified("deletedAt") && this.deletedAt) {
        await cascadeSoftDeletePostRelated(this);
    }
});
postSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    const update = this.getUpdate();
    const set = update?.$set || update;
    if (set?.deletedAt) {
        const postId = this.getQuery()?._id;
        if (postId) {
            const post = await this.model.findOne({ _id: postId });
            if (post) {
                await cascadeSoftDeletePostRelated(post);
            }
        }
    }
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);

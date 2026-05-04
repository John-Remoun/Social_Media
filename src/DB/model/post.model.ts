import { model, models, Schema, Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { IPost } from "../../common/interface";
import { AvailabilityEnum } from "../../common/Enums";

export type PostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
  {
    folderId: { type: String, required: true },
    content: {
      type: String,
      required: function (this: any) {
        return !this.attachments?.length;
      },
    },
    attachments: { type: [String] },
    availability: {
      type: Number,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.PUBLIC,
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    reactions: [
      {
        emoji: { type: String },
        userId: { type: Types.ObjectId, ref: "User" },
      },
    ],
    updatedBy: { type: Types.ObjectId, ref: "User" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_POSTS",
  },
);

async function cascadeSoftDeletePostRelated(post: PostDocument) {
  const now = new Date();
  await post
    .model("Comment")
    .updateMany(
      { postId: post._id, deletedAt: null },
      { $set: { deletedAt: now } },
    );
  await post
    .model("Notification")
    .updateMany(
      { "metadata.referenceId": post._id, deletedAt: null },
      { $set: { deletedAt: now } },
    );
}

postSchema.pre(["find", "findOne", "findOneAndUpdate"], function (this: any) {
  if (!this.getFilter) {
    return;
  }
  const filter = this.getFilter();
  if (filter?.deletedAt === undefined) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

postSchema.pre("save", async function (this: PostDocument) {
  if (this.isModified("deletedAt") && this.deletedAt) {
    await cascadeSoftDeletePostRelated(this);
  }
});

postSchema.pre(["updateOne", "findOneAndUpdate"], async function (this: any) {
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

export const PostModel = models.Post || model<IPost>("Post", postSchema);

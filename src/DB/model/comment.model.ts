import { model, models, Schema } from "mongoose";
import { HydratedDocument } from "mongoose";
import { IComment, ICommentReply } from "../../common/interface";

export type CommentDocument = HydratedDocument<IComment>;

const replySchema = new Schema<ICommentReply>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
  },
  { timestamps: true },
);

const commentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    replies: [replySchema],
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_COMMENTS",
  },
);

commentSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  function (this: any) {
    if (this.getOptions().withDeleted) return;
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

commentSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate"],
  { document: false, query: true },
  async function (this: any) {
    if (this.getOptions().withDeleted) return;
    const filter = this.getFilter();
    if (filter.deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
  },
);

const DELETE_OPS = ["deleteOne", "deleteMany"] as const;

DELETE_OPS.forEach((op) => {
  commentSchema.pre(
    op,
    { document: false, query: true },
    async function (this: any) {
      if (this.getOptions().hardDelete) return;
      const filter = this.getFilter();
      const target = await this.model.findOne({ ...filter, deletedAt: null });
      if (!target) {
        this.setQuery({ _id: null });
        return;
      }
      await this.model.updateOne(
        { _id: target._id },
        { $set: { deletedAt: new Date() } },
      );
      this.setQuery({ _id: null });
    },
  );
});

export const CommentModel =
  models.Comment || model<IComment>("Comment", commentSchema);

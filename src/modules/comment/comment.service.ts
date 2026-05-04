import { HydratedDocument, Types } from "mongoose";
import { IComment, IUser } from "../../common/interface";
import { ForbiddenException, NotFoundException } from "../../common/exceptions";
import {
  CommentRepository,
  NotificationRepository,
  PostRepository,
} from "../../DB/repository";
import {
  CreateCommentDto,
  UpdateCommentDto,
  ReactCommentDto,
} from "./comment.dto";
import { NotificationTypeEnum } from "../../common/Enums";

export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly postRepository: PostRepository;
  private readonly notificationRepository: NotificationRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.postRepository = new PostRepository();
    this.notificationRepository = new NotificationRepository();
  }

  async createComment(
    data: CreateCommentDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const post = await this.postRepository.findById({ id: data.postId });
    if (!post || (post as any).deletedAt) {
      throw new NotFoundException("Post not found");
    }

    const payload = {
      postId: new Types.ObjectId(data.postId),
      content: data.content,
      attachments: data.attachments || [],
      createdBy: user._id,
      replies: [],
    };

    const comment = await this.commentRepository.createOne({ data: payload });

    const recipientId = (post.createdBy as any).toString();
    if (recipientId !== user._id.toString()) {
      await this.notificationRepository.createOne({
        data: {
          title: "Someone commented on your post",
          message: data.content,
          senderId: user._id,
          recipientId: new Types.ObjectId(recipientId),
          type: NotificationTypeEnum.COMMENT,
          relatedEntityId: comment._id,
          relatedEntityType: "POST",
          isRead: false,
        },
      });
    }

    return comment;
  }

  async replyToComment(
    parentCommentId: string,
    data: { content: string; attachments?: string[] },
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const parentComment = await this.commentRepository.findById({
      id: parentCommentId,
    });
    if (!parentComment || (parentComment as any).deletedAt) {
      throw new NotFoundException("Parent comment not found");
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
      throw new NotFoundException("Failed to add reply");
    }

    const recipientId = (parentComment.createdBy as any).toString();
    if (recipientId !== user._id.toString()) {
      await this.notificationRepository.createOne({
        data: {
          title: "Someone replied to your comment",
          message: data.content,
          senderId: user._id,
          recipientId: new Types.ObjectId(recipientId),
          type: NotificationTypeEnum.REPLY,
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
    })) as IComment;
  }

  async listPostComments(postId: string): Promise<IComment[]> {
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

  async getCommentById(id: string): Promise<IComment> {
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
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundException("Comment not found");
    }
    return comment as IComment;
  }

  async updateComment(
    id: string,
    data: UpdateCommentDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findById({ id });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundException("Comment not found");
    }

    const ownerId = (comment.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenException("You cannot update this comment");
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
      throw new NotFoundException("Failed to update comment");
    }

    return updated as IComment;
  }

  async deleteComment(
    id: string,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findById({ id });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundException("Comment not found");
    }

    const ownerId = (comment.createdBy as any).toString();
    if (ownerId !== user._id.toString()) {
      throw new ForbiddenException("You cannot delete this comment");
    }

    const deleted = await this.commentRepository.updateOne({
      filter: { _id: id },
      update: { deletedAt: new Date() },
    });

    if (!deleted) {
      throw new NotFoundException("Failed to delete comment");
    }
    return deleted as IComment;
  }

  async reaction(
    id: string,
    data: ReactCommentDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findById({ id });
    if (!comment || (comment as any).deletedAt) {
      throw new NotFoundException("Comment not found");
    }

    const existingReactions = (comment.reactions || []) as Array<{
      emoji: string;
      userId: Types.ObjectId;
    }>;

    const emoji = data.emoji;
    const existingIndex = existingReactions.findIndex(
      (item) =>
        item.emoji === emoji && item.userId.toString() === user._id.toString(),
    );
    const reactions = [...existingReactions];

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ emoji, userId: user._id as Types.ObjectId });
    }

    const updated = await this.commentRepository.updateOne({
      filter: { _id: id },
      update: { reactions },
    });

    if (!updated) {
      throw new NotFoundException("Failed to update reaction");
    }
    return updated as IComment;
  }
}

export default new CommentService();

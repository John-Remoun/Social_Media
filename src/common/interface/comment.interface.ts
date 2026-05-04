import { Types } from "mongoose";
import { IPost } from "./post.interface";
import { IUser } from "./user.interface";

export interface ICommentReply {
  _id?: Types.ObjectId;
  createdBy: Types.ObjectId | IUser;
  content: string;
  attachments?: string[];
  reactions?: Array<{ emoji: string; userId: Types.ObjectId }>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IComment {
  _id?: object;
  postId: Types.ObjectId | IPost;
  createdBy: Types.ObjectId | IUser;
  content: string;
  attachments?: string[];
  reactions?: Array<{ emoji: string; userId: Types.ObjectId }>;
  replies?: ICommentReply[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { AvailabilityEnum } from "../Enums";

export interface IPost {
  folderId: string;
  content?: string;
  attachments?: string[];

  likes?: Types.ObjectId[] | IUser[];
  tags?: Types.ObjectId[] | IUser[];
  reactions?: Array<{ emoji: string; userId: Types.ObjectId }>;
  availability: AvailabilityEnum;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}

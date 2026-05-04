import { IComment } from "../../common/interface";
import { CommentModel } from "../model/comment.model";
import { DatabaseRepository } from "./base.repository";

export class CommentRepository extends DatabaseRepository<IComment> {
  constructor() {
    super(CommentModel);
  }
}

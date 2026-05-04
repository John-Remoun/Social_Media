import { IPost } from "../../common/interface";
import { PostModel } from "../model/post.model";
import { DatabaseRepository } from "./base.repository";

export class PostRepository extends DatabaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }
}

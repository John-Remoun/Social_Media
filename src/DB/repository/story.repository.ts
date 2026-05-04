import { IStory } from "../../common/interface";
import { StoryModel } from "../model/story.model";
import { DatabaseRepository } from "./base.repository";

export class StoryRepository extends DatabaseRepository<IStory> {
  constructor() {
    super(StoryModel);
  }
}

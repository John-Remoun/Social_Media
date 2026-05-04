"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryRepository = void 0;
const story_model_1 = require("../model/story.model");
const base_repository_1 = require("./base.repository");
class StoryRepository extends base_repository_1.DatabaseRepository {
    constructor() {
        super(story_model_1.StoryModel);
    }
}
exports.StoryRepository = StoryRepository;

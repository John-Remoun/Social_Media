"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const comment_model_1 = require("../model/comment.model");
const base_repository_1 = require("./base.repository");
class CommentRepository extends base_repository_1.DatabaseRepository {
    constructor() {
        super(comment_model_1.CommentModel);
    }
}
exports.CommentRepository = CommentRepository;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolver = exports.UserResolver = void 0;
const user_service_1 = require("../user.service");
const user_authorization_1 = require("../user.authorization");
const middleware_1 = require("../../../middleware");
const user_validation_1 = require("../user.validation");
class UserResolver {
    service;
    constructor() {
        this.service = new user_service_1.UserService();
    }
    profile = async (parent, args, { user }) => {
        if (!user) {
            throw new Error("Unauthorized");
        }
        await (0, middleware_1.GQLAuthorization)(user_authorization_1.endpoint.profile, user);
        await (0, middleware_1.GQLValidation)(user_validation_1.profileGQL, args);
        const data = await this.service.profile(user._id.toString());
        return {
            message: "hi",
            data,
        };
    };
}
exports.UserResolver = UserResolver;
exports.userResolver = new UserResolver();

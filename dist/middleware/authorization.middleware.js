"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const exceptions_1 = require("../common/exceptions");
const authorization = (accessRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            throw new exceptions_1.ForbiddenException("Unauthorized");
        }
        if (!accessRoles.includes(req.user.role)) {
            throw new exceptions_1.ForbiddenException("Not allowed account");
        }
        next();
    };
};
exports.authorization = authorization;

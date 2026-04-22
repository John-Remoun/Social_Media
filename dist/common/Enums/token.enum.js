"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutEnum = exports.tokenTypeEnum = void 0;
var tokenTypeEnum;
(function (tokenTypeEnum) {
    tokenTypeEnum[tokenTypeEnum["ACCESS"] = 0] = "ACCESS";
    tokenTypeEnum[tokenTypeEnum["REFRESH"] = 1] = "REFRESH";
})(tokenTypeEnum || (exports.tokenTypeEnum = tokenTypeEnum = {}));
var logoutEnum;
(function (logoutEnum) {
    logoutEnum[logoutEnum["ONLY"] = 0] = "ONLY";
    logoutEnum[logoutEnum["ALL"] = 1] = "ALL";
})(logoutEnum || (exports.logoutEnum = logoutEnum = {}));

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const Enums_1 = require("../../common/Enums");
const services_1 = require("../../common/services");
const exceptions_1 = require("../../common/exceptions");
const config_1 = require("../../config/config");
class UserService {
    redis;
    tokens;
    constructor() {
        this.redis = services_1.redisService;
        this.tokens = new services_1.tokenService();
    }
    async profile(user) {
        return user.toJSON();
    }
    async logout({ flag }, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case Enums_1.logoutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
                break;
            default:
                (await this.tokens.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + config_1.REFRESH_EXPIRES_IN,
                }),
                    (status = 201));
                break;
        }
        return status;
    }
    async rotateToken(user, { jti, iat, sub }, issuer) {
        if ((iat + config_1.ACCESS_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
            throw new exceptions_1.ConflictException("Current access token still valid");
        }
        await this.tokens.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + config_1.REFRESH_EXPIRES_IN,
        });
        return await this.tokens.createLoginCredentials(user, issuer);
    }
}
exports.UserService = UserService;
exports.default = new UserService();

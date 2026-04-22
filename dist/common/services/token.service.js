"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config/config");
const Enums_1 = require("../Enums");
const exceptions_1 = require("../exceptions");
const redis_service_1 = require("./redis.service");
const repository_1 = require("../../DB/repository");
const crypto_1 = require("crypto");
class tokenService {
    userRepository;
    redis;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = redis_service_1.redisService;
    }
    sign = async ({ payload, secret = config_1.User_TOKEN_SECRET_KEY, options, }) => {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    };
    verify = async ({ token, secret = config_1.User_TOKEN_SECRET_KEY, options, }) => {
        return jsonwebtoken_1.default.verify(token, secret);
    };
    detectSignatureLevel = async (role) => {
        let signatureLevel;
        switch (role) {
            case Enums_1.RoleEnum.ADMIN:
                signatureLevel = {
                    accessSignature: config_1.System_TOKEN_SECRET_KEY,
                    refreshSignature: config_1.System_REFRESH_TOKEN_SECRET_KEY,
                };
                break;
            default:
                signatureLevel = {
                    accessSignature: config_1.User_TOKEN_SECRET_KEY,
                    refreshSignature: config_1.User_REFRESH_TOKEN_SECRET_KEY,
                };
                break;
        }
        return signatureLevel;
    };
    getSignature = async (tokenType = Enums_1.tokenTypeEnum.ACCESS, signatureLevel) => {
        const signatures = await this.detectSignatureLevel(signatureLevel);
        let signature;
        switch (tokenType) {
            case Enums_1.tokenTypeEnum.ACCESS:
                signature = signatures.accessSignature;
                break;
            case Enums_1.tokenTypeEnum.REFRESH:
                signature = signatures.refreshSignature;
                break;
        }
        return signature;
    };
    decodeToken = async ({ token, tokenType = Enums_1.tokenTypeEnum.ACCESS, }) => {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            throw new exceptions_1.BadRequestException("Invalid token");
        }
        if (!Array.isArray(decoded.aud)) {
            throw new exceptions_1.BadRequestException("Invalid token audience format");
        }
        const [tokenApproach, signatureLevel] = decoded.aud;
        if (tokenApproach == undefined || !signatureLevel == undefined) {
            throw new exceptions_1.BadRequestException("Invalid token audience format");
        }
        if (tokenType !== tokenApproach) {
            throw new exceptions_1.BadRequestException(`Invalid token type. Only ${tokenType} allowed for this endpoint`);
        }
        if (decoded.jti &&
            (await this.redis.get(this.redis.revokeTokenKey({
                userId: decoded.sub,
                jti: decoded.jti,
            })))) {
            throw new exceptions_1.UnauthorizedException("Invalid login session");
        }
        const secret = await this.getSignature(tokenApproach, signatureLevel);
        const verifiedData = jsonwebtoken_1.default.verify(token, secret);
        if (!verifiedData?.sub) {
            throw new exceptions_1.BadRequestException("Invalid token payload");
        }
        const user = await this.userRepository.findOne({
            filter: { _id: verifiedData.sub },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("User not found");
        }
        if (user.changeCredentialsTime &&
            verifiedData.iat &&
            user.changeCredentialsTime.getTime() >= verifiedData.iat * 1000) {
            throw new exceptions_1.UnauthorizedException("Invalid login session");
        }
        return {
            user: user,
            decode: verifiedData,
        };
    };
    createLoginCredentials = async (user, issuer) => {
        const { accessSignature, refreshSignature } = await this.detectSignatureLevel(user.role);
        const jwtid = (0, crypto_1.randomUUID)();
        const Access_Token = await this.sign({
            payload: { sub: user._id },
            secret: accessSignature,
            options: {
                issuer,
                audience: [
                    Enums_1.tokenTypeEnum.ACCESS,
                    user.role,
                ],
                expiresIn: config_1.ACCESS_EXPIRES_IN,
                jwtid,
            },
        });
        const Refresh_Token = await this.sign({
            payload: { sub: user._id },
            secret: refreshSignature,
            options: {
                issuer,
                audience: [
                    Enums_1.tokenTypeEnum.REFRESH,
                    user.role,
                ],
                expiresIn: config_1.REFRESH_EXPIRES_IN,
                jwtid,
            },
        });
        return { Access_Token, Refresh_Token };
    };
    createRevokeToken = async ({ userId, jti, ttl }) => {
        await this.redis.set({
            key: this.redis.revokeTokenKey({ userId: userId.toString(), jti }),
            value: jti,
            ttl
        });
        return;
    };
}
exports.tokenService = tokenService;

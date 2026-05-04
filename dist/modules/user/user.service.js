"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const Enums_1 = require("../../common/Enums");
const services_1 = require("../../common/services");
const exceptions_1 = require("../../common/exceptions");
const config_1 = require("../../config/config");
const writePipeLine = (0, node_util_1.promisify)(node_stream_1.pipeline);
class UserService {
    redis;
    tokens;
    s3;
    constructor() {
        this.redis = services_1.redisService;
        this.tokens = new services_1.tokenService();
        this.s3 = services_1.s3Service;
    }
    async profile(user) {
        return user.toJSON();
    }
    async profileImage({ ContentType, originalname, }, user) {
        const { Key, url } = await this.s3.createPreSignedUploadLink({
            path: `users/${user._id.toString()}/profile`,
            ContentType,
            originalname,
        });
        user.profilePicture = Key;
        await user.save();
        return { user: user.toJSON(), url };
    }
    async profileCoverImages(files, user) {
        if (!files || files.length === 0) {
            throw new exceptions_1.BadRequestException("No files provided");
        }
        const keys = await this.s3.uploadFiles({
            files,
            path: `users/${user._id.toString()}/cover`,
            storageApproach: Enums_1.StorageApproachEnum.DISK,
            uploadApproach: Enums_1.UploadApproachEnum.LARGE,
        });
        user.profileCoverPicture = keys;
        await user.save();
        return user.toJSON();
    }
    async createPresignedUploadLink({ ContentType, originalname, path, }, user) {
        if (!ContentType || !originalname) {
            throw new exceptions_1.BadRequestException("ContentType and originalname are required");
        }
        const { url, Key } = await this.s3.createPreSignedUploadLink({
            ContentType,
            originalname,
            path: path || `users/${user._id.toString()}/uploads`,
            expiresIn: 3600,
        });
        return { uploadUrl: url, fileKey: Key };
    }
    async streamFile(key) {
        if (!key) {
            throw new exceptions_1.BadRequestException("Missing file key");
        }
        const s3Response = await this.s3.getFile({ Key: key });
        if (!s3Response?.Body) {
            throw new exceptions_1.BadRequestException("File not found or could not be fetched");
        }
        return {
            stream: s3Response.Body,
            ContentType: s3Response.ContentType,
        };
    }
    async pipeFileTo(stream, destination) {
        await writePipeLine(stream, destination);
    }
    async getDownloadUrl(key, downloadName) {
        if (!key) {
            throw new exceptions_1.BadRequestException("Missing file key");
        }
        return this.s3.createPreSignedDownloadLink({
            Key: key,
            expiresIn: 60,
            ...(downloadName && { downloadName }),
        });
    }
    async softDelete(user, { sub }) {
        if (user.$isDeleted()) {
            throw new exceptions_1.ConflictException("Account is already deleted");
        }
        user.$isDeleted(true);
        user.deletedAt = new Date();
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
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
                await this.tokens.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + config_1.REFRESH_EXPIRES_IN,
                });
                status = 201;
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
        return this.tokens.createLoginCredentials(user, issuer);
    }
}
exports.UserService = UserService;
exports.default = new UserService();

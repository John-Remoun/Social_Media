"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const exceptions_1 = require("../../common/exceptions");
const hash_security_1 = require("../../common/utils/security/hash.security");
const encryption_security_1 = require("../../common/utils/security/encryption.security");
const repository_1 = require("../../DB/repository");
const redis_service_1 = require("../../common/services/redis.service");
const token_service_1 = require("../../common/services/token.service");
const Enums_1 = require("../../common/Enums");
class AuthenticationService {
    userRepository;
    redis;
    tokens;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = redis_service_1.redisService;
        this.tokens = token_service_1.tokenService;
    }
    async login(data, issuer) {
        const { email, password } = data;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: Enums_1.ProviderEnum.SYSTEM,
                confirmEmail: { $exists: true }
            },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("Invalid credentials");
        }
        if (!user.password) {
            throw new exceptions_1.UnauthorizedException("This account uses Google login. Please sign in with Google.");
        }
        const isMatch = await (0, hash_security_1.compareHash)({
            plaintext: password,
            hash: user.password,
        });
        if (!isMatch) {
            throw new exceptions_1.UnauthorizedException("Invalid credentials");
        }
        if (!user.isConfirmed) {
            throw new exceptions_1.UnauthorizedException("Please confirm your email before logging in");
        }
        const tokenPair = this.tokens.generateTokens({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        await this.tokens.storeRefreshToken(user._id.toString(), tokenPair.refreshToken);
        return {
            ...tokenPair,
            user: this.sanitizeUser(user),
        };
    }
    async signup(data) {
        const exists = await this.findUserByEmail(data.email);
        if (exists) {
            throw new exceptions_1.ConflictException("User already exists");
        }
        const user = await this.createUser(data);
        if (!user) {
            throw new exceptions_1.BadRequestException("User creation failed");
        }
        await this.redis.sendEmailOtp({
            email: data.email,
            subject: Enums_1.EmailEnum.CONFIRM_EMAIL,
            title: "Verify Email",
        });
        return user;
    }
    async confirmEmail({ email, otp }) {
        const hashotp = await this.redis.get(this.redis.otpKey({ email, type: Enums_1.EmailEnum.CONFIRM_EMAIL }));
        if (!hashotp) {
            throw new exceptions_1.NotFoundException("OTP expired or invalid");
        }
        const account = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false }, provider: Enums_1.ProviderEnum.SYSTEM },
        });
        if (!account) {
            throw new exceptions_1.NotFoundException("Account not found or already confirmed");
        }
        if (await (0, hash_security_1.compareHash)({ plaintext: otp, cipherText: hashotp })) {
            throw new exceptions_1.ConflictException("Invalid OTP");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(this.redis.otpKey({ email, type: Enums_1.EmailEnum.CONFIRM_EMAIL }));
        return { message: "Email confirmed successfully" };
    }
    async reSendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false }, provider: Enums_1.ProviderEnum.SYSTEM },
        });
        if (!account) {
            throw new exceptions_1.NotFoundException("Account not found or already confirmed");
        }
        await this.redis.sendEmailOtp({
            email,
            subject: Enums_1.EmailEnum.CONFIRM_EMAIL,
            title: "Verify Email",
        });
        return { message: "OTP resent successfully" };
    }
    async logout(userId, accessToken) {
        await this.tokens.revokeRefreshToken(userId);
        try {
            const payload = this.tokens.verifyAccessToken(accessToken);
            const now = Math.floor(Date.now() / 1000);
            const remainingTTL = (payload.exp ?? now) - now;
            if (remainingTTL > 0) {
                await this.tokens.revokeAccessToken(userId, payload.jti, remainingTTL);
            }
        }
        catch {
        }
        return { message: "Logged out successfully" };
    }
    async refreshTokens(incomingRefreshToken) {
        const payload = this.tokens.verifyRefreshToken(incomingRefreshToken);
        const isValid = await this.tokens.validateStoredRefreshToken(payload.sub, incomingRefreshToken);
        if (!isValid) {
            await this.tokens.revokeRefreshToken(payload.sub);
            throw new exceptions_1.UnauthorizedException("Refresh token reuse detected. Please log in again.");
        }
        const newPair = this.tokens.generateTokens({
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        });
        await this.tokens.storeRefreshToken(payload.sub, newPair.refreshToken);
        return newPair;
    }
    async googleAuth(googleUser) {
        let user = await this.userRepository.findOne({
            filter: { email: googleUser.email },
            options: { lean: false },
        });
        if (!user) {
            user = await this.userRepository.createOne({
                data: {
                    ...googleUser,
                    provider: "google",
                    isConfirmed: true,
                    ConfirmEmail: new Date(),
                    role: "user",
                },
            });
        }
        else if (!user.googleId) {
            await this.userRepository.updateOne({
                filter: { email: googleUser.email },
                update: { googleId: googleUser.googleId, isConfirmed: true },
            });
        }
        const tokenPair = this.tokens.generateTokens({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        await this.tokens.storeRefreshToken(user._id.toString(), tokenPair.refreshToken);
        return { ...tokenPair, user: this.sanitizeUser(user) };
    }
    async findUserByEmail(email) {
        return this.userRepository.findOne({
            filter: { email },
            projection: { email: 1 },
            options: { lean: true },
        });
    }
    async createUser(data) {
        const securedData = await this.secureUserData(data);
        const user = await this.userRepository.createOne({ data: securedData });
        if (!user)
            throw new exceptions_1.BadRequestException("User creation failed");
        return this.normalizeUser(user);
    }
    async secureUserData(data) {
        return {
            ...data,
            phone: data.phone ? await (0, encryption_security_1.generateEncryption)(data.phone) : undefined,
            password: await (0, hash_security_1.generateHash)({ plaintext: data.password }),
        };
    }
    sanitizeUser(user) {
        const obj = user?.toObject ? user.toObject() : { ...user };
        delete obj.password;
        delete obj.__v;
        return obj;
    }
    async deleteUsers(filter, options) {
        return this.userRepository.deleteMany({ filter, options });
    }
    normalizeUser(user) {
        return user?.toJSON?.() ?? user;
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();

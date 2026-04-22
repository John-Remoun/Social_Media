"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const exceptions_1 = require("../../common/exceptions");
const hash_security_1 = require("../../common/utils/security/hash.security");
const encryption_security_1 = require("../../common/utils/security/encryption.security");
const repository_1 = require("../../DB/repository");
const redis_service_1 = require("../../common/services/redis.service");
const Enums_1 = require("../../common/Enums");
const services_1 = require("../../common/services");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("../../config/config");
class AuthenticationService {
    userRepository;
    redis;
    tokens;
    constructor() {
        this.userRepository = new repository_1.UserRepository();
        this.redis = redis_service_1.redisService;
        this.tokens = new services_1.tokenService();
    }
    async login(inputs, issuer) {
        const { email, password } = inputs;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: Enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("Invalid credentials");
        }
        if (!user.confirmEmail) {
            throw new exceptions_1.UnauthorizedException("Please confirm your email first");
        }
        if (!user.password) {
            throw new exceptions_1.UnauthorizedException("This account uses Google login. Please sign in with Google.");
        }
        const isMatch = await (0, hash_security_1.compareHash)({
            plaintext: password,
            cipherText: user.password,
        });
        if (!isMatch) {
            throw new exceptions_1.NotFoundException("Invalid credentials");
        }
        return await this.tokens.createLoginCredentials(user, issuer);
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
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, type: Enums_1.EmailEnum.CONFIRM_EMAIL }));
        if (!hashOtp) {
            throw new exceptions_1.NotFoundException("OTP expired or invalid");
        }
        const account = (await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: Enums_1.ProviderEnum.SYSTEM,
            },
        }));
        if (!account) {
            throw new exceptions_1.NotFoundException("Account not found or already confirmed");
        }
        if (!(await (0, hash_security_1.compareHash)({ plaintext: otp, cipherText: hashOtp }))) {
            throw new exceptions_1.ConflictException("Invalid OTP");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(this.redis.otpKey({ email, type: Enums_1.EmailEnum.CONFIRM_EMAIL }));
        return { message: "Email confirmed successfully" };
    }
    async reSendConfirmEmail({ email }) {
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: Enums_1.ProviderEnum.SYSTEM,
            },
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
    async verifyGoogleAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_1.CLIENT_IDS,
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new exceptions_1.BadRequestException("Fail to verify this account with Google");
        }
        return payload;
    }
    async loginWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const user = await this.userRepository.findOne({
            filter: {
                email: payload.email,
                provider: Enums_1.ProviderEnum.GOOGLE,
            },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("Invalid login data");
        }
        return await this.tokens.createLoginCredentials(user, issuer);
    }
    async signupWithGmail(idToken, issuer) {
        const payload = await this.verifyGoogleAccount(idToken);
        const checkUserExist = await this.userRepository.findOne({
            filter: {
                email: payload.email,
            },
        });
        if (checkUserExist) {
            if (checkUserExist?.provider == Enums_1.ProviderEnum.SYSTEM) {
                throw new exceptions_1.ConflictException("Account already exist with different provider");
            }
            const account = await this.loginWithGmail(idToken, issuer);
            return { account, status: 200 };
        }
        const user = await this.userRepository.createOne({
            data: {
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: payload.email,
                profilePicture: payload.picture,
                provider: Enums_1.ProviderEnum.GOOGLE,
                confirmEmail: new Date(),
            },
        });
        return {
            status: 201,
            Credential: await this.tokens.createLoginCredentials(user, issuer),
        };
    }
    async forgotPassword({ email }) {
        const user = await this.userRepository.findOne({
            filter: {
                email,
                provider: Enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("User not found");
        }
        await this.redis.sendEmailOtp({
            email,
            subject: Enums_1.EmailEnum.FORGOT_PASSWORD,
            title: "Forget Password",
        });
        return { message: "Reset password OTP sent successfully" };
    }
    async resetPassword({ email, otp, password }) {
        const hashOtp = await this.redis.get(this.redis.otpKey({ email, type: Enums_1.EmailEnum.RESET_PASSWORD }));
        if (!hashOtp) {
            throw new exceptions_1.NotFoundException("OTP expired or invalid");
        }
        const user = (await this.userRepository.findOne({
            filter: {
                email,
                provider: Enums_1.ProviderEnum.SYSTEM,
            },
        }));
        if (!user) {
            throw new exceptions_1.NotFoundException("User not found");
        }
        const isValidOtp = await (0, hash_security_1.compareHash)({
            plaintext: otp,
            cipherText: hashOtp,
        });
        if (!isValidOtp) {
            throw new exceptions_1.ConflictException("Invalid OTP");
        }
        const hashedPassword = await (0, hash_security_1.generateHash)({
            plaintext: password,
        });
        user.password = hashedPassword;
        await user.save();
        await this.redis.deleteKey(this.redis.otpKey({ email, type: Enums_1.EmailEnum.RESET_PASSWORD }));
        return { message: "Password reset successfully" };
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
    async deleteUsers(filter, options) {
        return this.userRepository.deleteMany({ filter, options });
    }
    normalizeUser(user) {
        return user?.toJSON?.() ?? user;
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();

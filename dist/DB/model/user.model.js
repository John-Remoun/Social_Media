"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const Enums_1 = require("../../common/Enums");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            return this.provider === Enums_1.ProviderEnum.SYSTEM;
        },
    },
    phone: { type: String },
    profilePicture: { type: String },
    coverPicture: { type: [String] },
    gender: {
        type: String,
        enum: Object.values(Enums_1.GenderEnum),
        default: Enums_1.GenderEnum.MALE,
    },
    role: {
        type: String,
        enum: Object.values(Enums_1.RoleEnum),
        default: Enums_1.RoleEnum.USER,
    },
    provider: {
        type: String,
        enum: Object.values(Enums_1.ProviderEnum),
        default: Enums_1.ProviderEnum.SYSTEM,
    },
    changeCredentialsTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_USERS",
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName;
    this.lastName = lastName;
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.UserModel = mongoose_1.models.user || (0, mongoose_1.model)("User", userSchema);

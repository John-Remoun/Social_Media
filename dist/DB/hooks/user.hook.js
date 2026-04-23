"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHooks = void 0;
const security_1 = require("../../common/utils/security");
const userHooks = (schema) => {
    schema.pre("save", async function () {
        if (this.isModified("password")) {
            this.password = await (0, security_1.generateHash)({ plaintext: this.password });
        }
        if (this.phone && this.isModified("phone")) {
            this.phone = await (0, security_1.generateEncryption)(this.phone);
        }
    });
    schema.pre("findOneAndUpdate", async function () {
        const update = this.getUpdate();
        if (!update)
            return;
        if (update.password) {
            update.password = await (0, security_1.generateHash)({ plaintext: update.password });
        }
        if (update.phone) {
            update.phone = await (0, security_1.generateEncryption)(update.phone);
        }
        update.updatedAt = new Date();
    });
    schema.pre(/^find/, function () {
        this.where({ isDeleted: { $ne: true } });
    });
    schema.post(/^find/, function (docs) {
        docs.forEach((doc) => {
            delete doc.password;
            delete doc.__v;
        });
    });
    schema.post("save", function (doc) {
        console.log("✅ New User:", doc.email);
    });
    schema.post("findOneAndUpdate", function (doc) {
        if (doc) {
            console.log("✏️ User Updated:", doc._id);
        }
    });
    schema.pre("deleteOne", { document: true }, async function () {
        const user = this;
        console.log("⚠️ Deleting user:", user._id);
    });
    schema.pre("aggregate", function () {
        this.pipeline().unshift({
            $match: { isDeleted: { $ne: true } }
        });
    });
    schema.pre("countDocuments", function () {
        this.where({ isDeleted: { $ne: true } });
    });
};
exports.userHooks = userHooks;

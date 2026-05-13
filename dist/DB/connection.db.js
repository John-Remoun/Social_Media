"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const config_1 = require("../config/config");
const connectDB = async () => {
    if (!config_1.DB_URI) {
        throw new Error("DB_URI is not defined. Please set DB_URI in your environment file.");
    }
    try {
        await (0, mongoose_1.connect)(config_1.DB_URI, { serverSelectionTimeoutMS: 3000 });
        console.log("DB Connected Successfully 😉");
    }
    catch (error) {
        console.error("DB Connection Failed 😒", error);
        throw error;
    }
};
exports.default = connectDB;

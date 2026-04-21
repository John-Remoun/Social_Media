"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./middleware");
const config_1 = require("./config/config");
const connction_db_1 = __importDefault(require("./DB/connction.db"));
const services_1 = require("./common/services");
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use("/auth", modules_1.authRouter);
    app.use(middleware_1.globalErrorHandler);
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Landing Page............." });
    });
    app.get("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "Invalid application routing" });
    });
    await (0, connction_db_1.default)();
    await services_1.redisService.connect();
    app.listen(config_1.port, () => {
        console.log(`Server is running on port ${config_1.port} 🚀`);
    });
    console.log("App bootstrap is running 🏃");
};
exports.default = bootstrap;

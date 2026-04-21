"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_js_1 = require("../../../config/config.js");
const sendEmail = async ({ to, cc, bcc, subject, html, attachments = [], }) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: config_js_1.EMAIL_APP,
            pass: config_js_1.EMAIL_APP_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        to,
        cc,
        bcc,
        subject,
        attachments,
        html,
        from: `"${config_js_1.APPLICATION_NAME}" <${config_js_1.EMAIL_APP}>`,
    });
    console.log("Message sent:", info.messageId);
    if (config_js_1.NODE_ENV === "development") {
        console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
    }
};
exports.sendEmail = sendEmail;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)("./src/config/social-media-app-868bc-firebase-adminsdk-fbsvc-00f41c0bed.json"), "utf8"));
const firebaseApp = firebase_admin_1.default.apps.length
    ? firebase_admin_1.default.app()
    : firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(serviceAccount) });
class NotificationService {
    messaging;
    constructor() {
        this.messaging = firebaseApp.messaging();
    }
    async sendNotification(token, title, body) {
        await this.messaging.send({
            notification: { title, body },
            token,
        });
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.allSettled(tokens.map((token) => this.sendNotification(token, data.title, data.body)));
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();

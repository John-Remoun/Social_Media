import admin from "firebase-admin";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

// ─── FIREBASE SINGLETON ────────────────────────────────────────────────────────
// initializeApp runs ONCE when this module is first imported.
// Every subsequent import reuses the cached module — initializeApp is never
// called again, so the "app already exists" error cannot occur.

const serviceAccount = JSON.parse(
  readFileSync(
    resolve("./src/config/social-media-app-868bc-firebase-adminsdk-fbsvc-00f41c0bed.json"),
    "utf8",
  ),
);

const firebaseApp = admin.apps.length
  ? admin.app()
  : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ──────────────────────────────────────────────────────────────────────────────

export class NotificationService {
  private readonly messaging: admin.messaging.Messaging;

  constructor() {
    // Reuse the singleton app — never call initializeApp here
    this.messaging = firebaseApp.messaging();
  }

  async sendNotification(token: string, title: string, body: string): Promise<void> {
    await this.messaging.send({
      notification: { title, body },
      token,
    });
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }): Promise<void> {
    // allSettled so one bad token doesn't cancel the rest
    await Promise.allSettled(
      tokens.map((token) => this.sendNotification(token, data.title, data.body)),
    );
  }
}

export const notificationService = new NotificationService();
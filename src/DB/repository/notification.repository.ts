import { INotification } from "../../common/interface";
import { NotificationModel } from "../model/notification.model";
import { DatabaseRepository } from "./base.repository";

export class NotificationRepository extends DatabaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }
}

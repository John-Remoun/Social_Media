import { IAuthSocket } from "../../../common/types/express.types";
import { socketValidation } from "../../../middleware";
import { ChatService } from "../chat.service";
import * as validators from "../chat.validation";
export class ChatEvent {
  private chatService: ChatService;
  constructor() {
    this.chatService = new ChatService();
  }

  sayHi = (socket: IAuthSocket) => {
    return socket.on("sayHi", async (data: { name: string }) => {
      try {
        await socketValidation<{ name: string }>(validators.sayHi, data);
        console.log({ data });
        const result = this.chatService.sayHi();
        socket.emit("sayHiBack", { message: result, timestamp: new Date() });
      } catch (error) {
        socket.emit("An error occurred", error);
      }
    });
  };
}

export const chatEvent = new ChatEvent();

import { Server } from "socket.io";

import { chatEvent, ChatEvent } from "./chat.event";
import { IAuthSocket } from "../../../common/types/express.types";

export class ChatGateway {
    private chatEvent: ChatEvent;
    
    constructor() {
        this.chatEvent = chatEvent;
    }

    registerEvents = (socket: IAuthSocket, io: Server) => {
        this.chatEvent.sayHi(socket);
    }
}

export const chatGateway = new ChatGateway();
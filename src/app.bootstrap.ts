import express from "express";
import { Express, Request, Response, NextFunction } from "express";
import {
  authRouter,
  userRouter,
  postRouter,
  commentRouter,
  storyRouter,
  notificationRouter,
  schema,
  realtimeGateway,
} from "./modules";
import { authentication, globalErrorHandler } from "./middleware";
import { port } from "./config/config";
import connectDB from "./DB/connection.db";
import { redisService } from "./common/services";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";

const bootstrap = async (): Promise<void> => {
  const app: Express = express();

  app.use(express.json(), cors());

  app.all(
    "/graphql",
    authentication(),
    createHandler({
      schema: schema,
      context: (req) => ({ user: req.raw.user, decoded: req.raw.decoded }),
    }),
  );
  //   Application-Routing
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/comment", commentRouter);
  app.use("/story", storyRouter);
  app.use("/notification", notificationRouter);

  //   Error Handling
  app.use(globalErrorHandler);

  //   Landing Page
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: "Landing Page............." });
  });

  //   Invalid application routing
  app.get("/*dummy", (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: "Invalid application routing" });
  });

  //   Connect to Database
  await connectDB();

  //   Connect to Redis
  await redisService.connect();

  //   Server
  const httpServer = app.listen(port, () => {
    console.log(`Server is running on port ${port} 🚀`);
  });

  //   Initialize Socket.io
  await realtimeGateway.initializeIo(httpServer);

  console.log("App bootstrap is running 🏃");
};
export default bootstrap;

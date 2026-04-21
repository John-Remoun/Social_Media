import express from "express";
import { Express, Request, Response, NextFunction } from "express";
import { authRouter, userRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { port } from "./config/config";
import connectDB from "./DB/connction.db";
import { redisService } from "./common/services";
import cors from 'cors'

const bootstrap = async (): Promise<void> => {
  const app: Express = express();
  
  app.use(express.json() , cors());

  //   Application-Routing
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

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
  app.listen(port, () => {
    console.log(`Server is running on port ${port} 🚀`);
  });

  console.log("App bootstrap is running 🏃");
};
export default bootstrap;

import { config } from "dotenv";
import path, { resolve } from "path";
config({path: resolve("./config/.env")});
//  path: resolve("./config/.env")
import { pipeline } from "stream";
import { promisify } from "util";
import morgan from "morgan";
const writePipeLine = promisify(pipeline);
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { AppError } from "./utilities/classError";
import userRouter from "./modules/users/users.controller";
import { connectionDB } from "./DB/connectionDB";
import postRouter from "./modules/posts/posts.controller";
const app: express.Application = express();
import { initialize } from "./modules/gateway/gateway";
import chatRouter from "./modules/chats/chat.controller";

import { createHandler } from "graphql-http/lib/use/express";
import { schemaGQl } from "./modules/graphql/schema.gql";

const port: string | number = process.env.PORT || 5000;
const limiter = rateLimit({
  max: 10,
  windowMs: 5 * 60 * 1000,
  message: {
    error: "too many requests",
  },
  statusCode: 429,
  legacyHeaders: false,
});

const connectionSockets = new Map<string, string>();

const bootstrap = async () => {
  app.use(express.json());
  app.use(helmet());
  app.use(cors());
  // app.use(limiter);

 

app.post("/graphql", createHandler({ schema:schemaGQl , context:(req)=>({req}) }));


  app.use("/api/user", userRouter);
  app.use("/api/post", postRouter);
  app.use("/api/chat",chatRouter);

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "welcome to my socialApp." });
  });

  await connectionDB();
  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(
      `404 not found URL ,Invalid URL ${req.originalUrl}`,
      404
    );
  });
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    return res
      .status((err.cause as unknown as number) || 500)
      .json({ message: err.message, stack: err.stack });
  });
  const server = app.listen(port , () => {
    console.log(`server is running on ${port}`);
  });


  initialize(server)


};

export default bootstrap;

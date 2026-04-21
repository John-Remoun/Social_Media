import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { successResponse } from "../../common/response";
import userService from "./user.service";
import { authentication, authorization } from "../../middleware";
import { endpoint } from "./user.authorization";
import { tokenTypeEnum } from "../../common/Enums";

const router = Router();

//  profile
router.get(
  "/profile",
  authentication(),
  authorization(endpoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = await userService.profile(req.user);

    return successResponse({ res, data });
  },
);

//  logout
router.post(
  "/logout",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const status = await userService.logout(
      req.body,
      req.user,
      req.decoded as { jti: string; iat: number; sub: string },
    );
    return successResponse({ res, status });
  },
);

//  rotate-token
router.post(
  "/rotate-token",
  authentication(tokenTypeEnum.REFRESH),
  async (req: Request, res: Response, next: NextFunction) => {
    const credential = await userService.rotateToken(
      req.user,
      req.decoded as { jti: string; iat: number; sub: string },
      `${req.protocol}://${req.host}`,
    );
    return successResponse({ res, status: 201, data: { ...credential } });
  },
);

export default router;

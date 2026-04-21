import type { NextFunction, Response } from "express";
import { RoleEnum } from "../common/Enums";
import { ForbiddenException } from "../common/exceptions";

export const authorization = (accessRoles: RoleEnum[]) => {
  return async (req: any, res: Response, next: NextFunction) => {

    if (!req.user) {
      throw new ForbiddenException("Unauthorized");
    }

    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenException("Not allowed account");
    }

    next();
  };
};
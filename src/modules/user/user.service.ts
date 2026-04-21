import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interface";
import { logoutEnum } from "../../common/Enums";
import {
  redisService,
  RedisService,
  tokenService,
} from "../../common/services";
import { ConflictException } from "../../common/exceptions";
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../config/config";

export class UserService {
  private readonly redis: RedisService;
  private readonly tokens: tokenService;

  constructor() {
    this.redis = redisService;
    this.tokens = new tokenService();
  }

  //  profile
  async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user.toJSON();
  }

  //  logout
  async logout(
    { flag }: { flag: logoutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> {
    let status = 200;
    switch (flag) {
      case logoutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.deleteKey(
          await this.redis.keys(this.redis.baseRevokeTokenKey(sub)),
        );
        break;
      default:
        (await this.tokens.createRevokeToken({
          userId: sub,
          jti,
          ttl: iat + REFRESH_EXPIRES_IN,
        }),
          (status = 201));
        break;
    }
    return status;
  }

  //  rotateToken
  async rotateToken(
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
    issuer: string,
  ) {
    if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
      throw new ConflictException("Current access token still valid");
    }
    await this.tokens.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + REFRESH_EXPIRES_IN,
    });

    return await this.tokens.createLoginCredentials(user, issuer);
  }
}

export default new UserService();

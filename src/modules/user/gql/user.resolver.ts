import { UserService } from "../user.service";
import { IUser } from "../../../common/interface";
import { IAuthUser } from "../../../common/types/express.types";
import { endpoint } from "../user.authorization";
import { GQLAuthorization, GQLValidation } from "../../../middleware";
import { profileGQL } from "../user.validation";

export class UserResolver {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  profile = async (
    parent: unknown,
    args: {
      search?: string;
    },
    { user }: IAuthUser,
  ): Promise<{ message: string; data: IUser }> => {
    // authentication
    if (!user) {
      throw new Error("Unauthorized");
    }
    await GQLAuthorization(endpoint.profile,user);
    await GQLValidation<{
      search?: string;
    }>(profileGQL,args);
    const data = await this.service.profile(user._id.toString());

    return {
      message: "hi",
      data,
    };
  };
}

export const userResolver = new UserResolver();

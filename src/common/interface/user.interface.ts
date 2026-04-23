import { GenderEnum, ProviderEnum, RoleEnum } from "../Enums";

export interface IUser {
  _id: object;
  firstName: string;
  lastName: string;
  username?: string;
  slug: string;

  email: string;
  password: string;

  phone?: string;
  profilePicture?: string;
  profileCoverPicture?: string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;

  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

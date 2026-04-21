import { GenderEnum, ProviderEnum, RoleEnum } from "../Enums";

export interface IUser {

  firstName: string;
  lastName: string;
  username?: string;

  email: string;
  password: string;

  phone?: string;
  profilePicture?: string;
  coverPicture?: string;

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;

  createdAt?: Date;
  updatedAt?: Date;

}
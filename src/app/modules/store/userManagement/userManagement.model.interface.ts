import { IUserVerification } from 'src/app/models/user';

export interface IUserManagementStates {
  userVerificationState: IUserVerification | null;
  isError: false | string;
  isLoading: boolean;
}

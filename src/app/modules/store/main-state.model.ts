import { IBankAccountsState } from 'src/app/models/bank';
import { ICardsStates } from 'src/app/models/card';
import { ICloudBankStates } from 'src/app/models/cloudBank';

import { IWalletsStates } from 'src/app/models/wallet';
import { ICategoriesState } from '../category/model/category';
import { IPayeesState } from '../payee/payee-v2/model/payee';
import { IUserManagementStates } from './userManagement/userManagement.model.interface';

export interface IMainState {
  payeesStates: IPayeesState;
  bankAccountsStates: IBankAccountsState;
  cardsStates: ICardsStates;
  walletsStates: IWalletsStates;
  categoriesStates: ICategoriesState;
  cloudBankStates: ICloudBankStates;
  userManagementStates: IUserManagementStates;
}

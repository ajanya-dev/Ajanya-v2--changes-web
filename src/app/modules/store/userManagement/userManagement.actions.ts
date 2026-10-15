import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IUserVerification } from 'src/app/models/user';

/**
 * Actions related to managing userManagement.
 */
export const UserManagementActions = createActionGroup({
  source: 'userManagement',
  events: {
    /**
     * Load user verification action.
     */
    'Load User Verification': emptyProps(),

    /**
     * Load userManagement success action.
     *
     * @param verificationState -  userManagement verification data.
     */
    'Load User Verification Success': props<{
      verificationState: IUserVerification;
    }>(),

    /**
     * Load userManagement failure action.
     *
     * @param error - An error state - type : boolean-false or string.
     */
    'Load User Verification Failure': props<{ error: false | string }>(),

    /**
     * Manually update userManagement data action.
     *
     * @param verificationState -  userManagement verification data.
     */
    'manual Update User Verification': props<{
      verificationState: Partial<IUserVerification>;
    }>(),

    /**
     * Loading userManagement action.
     */
    'Loading User Verification': emptyProps(),

    /**
     * clear userManagement action.
     */
    'Clear User Verification': emptyProps()
  }
});

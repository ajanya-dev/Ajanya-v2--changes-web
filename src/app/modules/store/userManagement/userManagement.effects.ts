import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { UserManagementActions } from './userManagement.actions';
import { Store, select } from '@ngrx/store';
import { IAppState } from 'src/app/store/app-state.model';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IUserVerification } from 'src/app/models/user';
import {
  selectUserIsLoading,
  selectUserVerification
} from './userManagement.selectors';

@Injectable()
export class UserManagementEffects {
  private userProfileService = inject(UserProfileService);
  private store = inject(Store<IAppState>);
  private actions$ = inject(Actions);

  /**
   * Effect responsible for loading user verification data.
   */
  getUserVerification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserManagementActions.loadUserVerification),
      withLatestFrom(this.store.pipe(select(selectUserIsLoading))),
      filter(([action, selectUserIsLoading]) => !selectUserIsLoading),
      withLatestFrom(this.store.pipe(select(selectUserVerification))),
      filter(
        ([action, selectUserVerification]) => selectUserVerification === null
      ),
      mergeMap(() => {
        this.store.dispatch(UserManagementActions.loadingUserVerification());
        return this.userProfileService.checkEmailAndPhoneVerified().pipe(
          map((res: IApiRes<IUserVerification> | IApiResMesssage) => {
            if (res?.success) {
              return UserManagementActions.loadUserVerificationSuccess({
                verificationState: (res as IApiRes<IUserVerification>).data
              });
            }
            return UserManagementActions.loadUserVerificationFailure({
              error: (res as IApiResMesssage).message ?? 'Something went wrong!'
            });
          }),
          catchError((err: Error) =>
            of(
              UserManagementActions.loadUserVerificationFailure({
                error: 'Something went wrong!'
              })
            )
          )
        );
      })
    )
  );
}

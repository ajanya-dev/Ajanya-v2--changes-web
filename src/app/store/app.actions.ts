import { createActionGroup, props } from '@ngrx/store';

export const AppActions = createActionGroup({
  source: 'App',
  events: {
    'App Init': props<{ isUserLoggedIn: boolean }>()
  }
});

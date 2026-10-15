import { createAction, props } from '@ngrx/store';
import { ILayoutVariables } from 'src/app/store/app-state.model';

export const storeVariables = createAction(
  '[Layout] Store Variables',
  props<ILayoutVariables>()
);

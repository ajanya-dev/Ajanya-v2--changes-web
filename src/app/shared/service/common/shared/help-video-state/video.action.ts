import { createAction, props } from '@ngrx/store';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
/**
 * Action for help videos.
 */
export const retrieveHelpVideo = createAction('[Post API] help video success');
export const retrieveHelpVideoSuccess = createAction(
  '[Post API] help video api success',
  props<{ helpVideos: IDemoVideo }>()
);

import { Action, createReducer, on } from '@ngrx/store';
import { retrieveHelpVideoSuccess } from './video.action';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
/**
 * Reducer for help videos.
 */
const helpVideo = createReducer(
  {},
  on(retrieveHelpVideoSuccess, (state, { helpVideos }) => {
    return helpVideos;
  })
);
export function helpVideoReducer(state: IDemoVideo, action: Action) {
  return helpVideo(state, action);
}

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
/**
 * Selector for help videos
 */
export const selectHelpVideos = createFeatureSelector<IDemoVideo>('helpVideos');
export const selectHelpVideosState = createSelector(
  selectHelpVideos,
  (state: IDemoVideo) => state
);

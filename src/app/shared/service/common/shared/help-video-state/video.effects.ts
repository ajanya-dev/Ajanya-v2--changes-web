import { Injectable, OnDestroy, inject } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DemoVideoService } from 'src/app/shared/service/common/demo-video/demo-video.service';
import { retrieveHelpVideo, retrieveHelpVideoSuccess } from './video.action';
/**
 * Effect for help-videos
 */
@Injectable()
export class helpVideoEffects implements OnDestroy {
  private actions$ = inject(Actions);
  private DemoVideoService = inject(DemoVideoService);
  private unsubscribe$ = new Subject();
  /**
   * Effects for Retrieving help-video details from backend
   */
  loadHelpVideos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(retrieveHelpVideo),
      switchMap(() =>
        this.DemoVideoService.getDemoVideos().pipe(
          takeUntil(this.unsubscribe$),
          map((data) =>
            retrieveHelpVideoSuccess({
              helpVideos: data.data
            })
          )
        )
      )
    )
  );
  /**
   * Avoiding memory leak.
   */
  ngOnDestroy() {
    this.unsubscribe$.next(true);
    this.unsubscribe$.complete();
  }
}

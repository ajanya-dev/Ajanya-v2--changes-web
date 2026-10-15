import { HttpClient } from '@angular/common/http';
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IDemoVideo } from 'src/app/shared/components/demo-video/model/demovideo';
import { environment } from 'src/environments/environment';
import { selectHelpVideos } from '../shared/help-video-state/video.selector';
import { retrieveHelpVideo } from '../shared/help-video-state/video.action';

@Injectable({
  providedIn: 'root'
})
export class DemoVideoService implements OnDestroy {
  ROOT_URL = environment.rootUrl;
  private store = inject(Store);
  private getHelpVideo$ = new BehaviorSubject<IDemoVideo | undefined>(
    undefined
  );
  constructor(private http: HttpClient) {}
  subscriptions: Subscription[] = [];
  private fetchedOnces = false;

  getDemoVideos(): Observable<IApiRes<IDemoVideo>> {
    return this.http.get<IApiRes<IDemoVideo>>(`${this.ROOT_URL}/help-videos`);
  }

  setHelpVideos(data: IDemoVideo): void {
    this.getHelpVideo$.next(data);
  }

  getHelpVideos(): Observable<IDemoVideo | undefined> {
    return this.getHelpVideo$.asObservable();
  }

  /**
   * Method to fetch data from store
   */
  loadDemoVideos() {
    if (this.fetchedOnces) {
      return;
    }
    this.fetchedOnces = true;
    this.subscriptions.push(
      this.store.pipe(select(selectHelpVideos)).subscribe((helpVideos) => {
        if (Object.keys(helpVideos).length === 0) {
          this.store.dispatch(retrieveHelpVideo());
        } else {
          this.setHelpVideos(helpVideos);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

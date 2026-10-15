import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @description This is custom preloading strategyservice we can use if needed. we need to set preload true in data property in routes and give a loadAfterSeconds.
 * if so this preload strategy loads it even before user goes to the specific route according to the loadAfterSeconds time.
 * @class Custom Preloding Strategy Service Class.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategyService implements PreloadingStrategy {
  /**
   * @description Preloading Function to be defined when implementing PreloadingStrategy.
   * @param route -takes a route as param.
   * @param fn - and a function that retursn an observable
   * @returns - either observable of null or function with some delay.
   */
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    const loadRoute = (delay: number) =>
      delay > 0 ? timer(delay * 1000).pipe(map(() => fn())) : fn();

    if (route.data?.preload) {
      const delay = route.data.loadAfterSeconds
        ? route.data.loadAfterSeconds
        : 0;
      return loadRoute(delay);
    }

    return of(null);
  }
}

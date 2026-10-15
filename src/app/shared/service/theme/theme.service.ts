import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private colorTheme: string;
  private themeSwitchSubject = new Subject<boolean>();
  isDarkMode: boolean;

  constructor(
    private _localStorageService: LocalStorageService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  sendThemeSwitch(isDarkMode: boolean) {
    this.themeSwitchSubject.next(isDarkMode);
  }

  getThemeSwitch(): Observable<boolean> {
    return this.themeSwitchSubject.asObservable();
  }

  removeThemes() {
    this.renderer.removeClass(document.body, 'light-mode');
    this.renderer.removeClass(document.body, 'dark-mode');
  }

  initTheme() {
    this.removeThemes();
    this.getColorTheme();
    this.renderer.addClass(document.body, this.colorTheme);
  }

  setLightMode() {
    this.removeThemes();
    this.getColorTheme();
    this.disableTheme();
  }

  disableTheme() {
    this.renderer.removeClass(document.body, 'dark-mode');
    this.renderer.addClass(document.body, 'light-mode');
  }

  update(theme: 'dark-mode' | 'light-mode') {
    this.setColorTheme(theme);
    const previousColorTheme =
      theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    this.renderer.removeClass(document.body, previousColorTheme);
    this.renderer.addClass(document.body, theme);
  }

  getInitialColourTheme() {
    if (this._localStorageService.getItem('user-theme')) {
      if (this._localStorageService.getItem('user-theme') === 'dark-mode') {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  private setColorTheme(theme: string) {
    this.colorTheme = theme;
    this._localStorageService.setItem('user-theme', theme);
  }

  private getColorTheme() {
    if (this._localStorageService.getItem('user-theme')) {
      this.colorTheme = this._localStorageService.getItem('user-theme')!;
    } else {
      this.colorTheme = 'light-mode';
    }
  }
}

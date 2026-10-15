import { Injectable, signal, inject } from '@angular/core';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';

@Injectable({
  providedIn: 'root'
})
export class V4SidebarService {
  private localStorageService = inject(LocalStorageService);
  private layoutService = inject(LayoutService);

  private static readonly STORAGE_KEY = 'v4SidebarCollapsed';

  /** Flips to true when the active company is switched so the sidebar can re-render. */
  readonly companySwitched = signal<boolean>(false);
  // COMMENTED OUT - home/favorite feature disabled
  // private static readonly FAVORITES_KEY = 'v4SidebarFavorites';
  // private static readonly HOME_PAGE_KEY = 'v4SidebarHomePage';

  isCollapsed = signal<boolean>(this.loadCollapsedState());
  expandedSections = signal<Set<string>>(new Set(['MAIN']));
  isMobileOpen = signal<boolean>(false);

  // COMMENTED OUT - home/favorite feature disabled
  // /** Names of favorited menu items */
  // favorites = signal<string[]>(this.loadFavorites());
  favorites = signal<string[]>([]);

  // /** routerLink of the item set as home page */
  // homePage = signal<string>(this.loadHomePage());
  homePage = signal<string>('');

  private loadCollapsedState(): boolean {
    return !!this.localStorageService.getItem(V4SidebarService.STORAGE_KEY);
  }

  // COMMENTED OUT - home/favorite feature disabled
  // private loadFavorites(): string[] {
  //   const stored = this.localStorageService.getItem(
  //     V4SidebarService.FAVORITES_KEY
  //   );
  //   if (stored && Array.isArray(stored)) {
  //     if (!stored.includes('Dashboard')) {
  //       stored.unshift('Dashboard');
  //     }
  //     return stored;
  //   }
  //   return ['Dashboard', 'Verification Centre'];
  // }

  // private loadHomePage(): string {
  //   return (
  //     this.localStorageService.getItem(V4SidebarService.HOME_PAGE_KEY) || 'home'
  //   );
  // }

  // private saveFavorites(favs: string[]): void {
  //   this.localStorageService.setItem(V4SidebarService.FAVORITES_KEY, favs);
  // }

  toggleCollapse(): void {
    const newState = !this.isCollapsed();
    this.isCollapsed.set(newState);
    this.localStorageService.setItem(V4SidebarService.STORAGE_KEY, newState);
    this.layoutService.setMessage(!newState);
  }

  toggleSection(category: string): void {
    if (category === 'MAIN') return;
    this.expandedSections.update((sections) => {
      if (sections.has(category)) {
        return new Set(['MAIN']);
      }
      return new Set(['MAIN', category]);
    });
  }

  isSectionExpanded(category: string): boolean {
    return this.expandedSections().has(category);
  }

  expandSection(category: string): void {
    this.expandedSections.set(new Set(['MAIN', category]));
  }

  openMobile(): void {
    this.isMobileOpen.set(true);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  // ── Favorites - COMMENTED OUT (home/favorite feature disabled) ──

  // isFavorited(itemName: string): boolean {
  //   return this.favorites().includes(itemName);
  // }

  // toggleFavorite(itemName: string): void {
  //   if (itemName === 'Dashboard') return;
  //   this.favorites.update((prev) => {
  //     const next = prev.includes(itemName)
  //       ? prev.filter((n) => n !== itemName)
  //       : [...prev, itemName];
  //     this.saveFavorites(next);
  //     return next;
  //   });
  // }

  // ── Home page - COMMENTED OUT (home/favorite feature disabled) ──

  // isHomePage(routerLink: string | undefined): boolean {
  //   if (!routerLink) return false;
  //   return this.homePage() === routerLink;
  // }

  // setHomePage(routerLink: string): void {
  //   this.homePage.set(routerLink);
  //   this.localStorageService.setItem(
  //     V4SidebarService.HOME_PAGE_KEY,
  //     routerLink
  //   );
  // }

  // /**
  //  * Get all menu items from all sections (flat list).
  //  */
  // getAllMenuItems(): IV4MenuItem[] {
  //   const allItems: IV4MenuItem[] = [];
  //   V4SideBar.menuSections().forEach((section) => {
  //     section.items.forEach((item) => allItems.push(item));
  //   });
  //   return allItems;
  // }

  // /**
  //  * Build the MAIN section items from the current favorites list.
  //  */
  // buildMainFromFavorites(sections: IV4MenuSection[]): IV4MenuSection[] {
  //   const allItems = this.getAllMenuItems();
  //   const favNames = this.favorites();
  //   let mainItems = favNames
  //     .map((name) => allItems.find((item) => item.name === name))
  //     .filter((item): item is IV4MenuItem => item !== undefined);
  //   const hp = this.homePage();
  //   const homeItem = allItems.find((item) => item.routerLink === hp);
  //   if (homeItem && !mainItems.some((item) => item.name === homeItem.name)) {
  //     mainItems.push(homeItem);
  //   }
  //   mainItems = mainItems.filter(
  //     (item, idx, self) => idx === self.findIndex((t) => t.name === item.name)
  //   );
  //   return sections.map((section) => {
  //     if (section.category === 'MAIN') {
  //       return { ...section, items: mainItems };
  //     }
  //     return section;
  //   });
  // }
 
  setCompanySwitched(value: boolean): void {
    this.companySwitched.set(value);
  }
}

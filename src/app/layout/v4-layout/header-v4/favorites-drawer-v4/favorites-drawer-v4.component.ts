import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

import { MainHeader } from 'src/app/data/data/menu/header/MainHeader';
import { IHeaderLinks } from 'src/app/layout/model/header';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { FavoriteCommonOnInitV4Service } from './favorite-common-on-init-v4.service';
import { v4LucideIconsMap } from '../../lucide-v4-icons';

/** Max pinned favorites; adding a 5th evicts the oldest (FIFO). Design-system (V2.1): 4. */
const MAX_FAVORITES = 4;

/** V4 lucide icon per tile id (keys match MainHeader ids). Falls back to 'receipt'. */
const TILE_ICONS: Readonly<Record<string, string>> = {
  ach: 'dollar-sign',
  bank: 'landmark',
  bill: 'receipt',
  blankChecks: 'banknote',
  multiChecks: 'layers', // Bulk Pay
  'user-cash': 'circle-dollar-sign', // Cash Expense
  checkDraft: 'file-lock-2',
  creditCard: 'credit-card',
  depositSlip: 'file-box',
  fundWallet: 'wallet',
  importCheck: 'download',
  invoice: 'file-text',
  issueVisaCard: 'credit-card',
  mailCheck: 'mail',
  mailDocument: 'mail-open',
  mailDashboard: 'layout-dashboard',
  multipleCheck: 'copy',
  payee: 'user',
  paymentLink: 'link-2',
  positivePay: 'shield-check',
  shippingLabel: 'package',
  user: 'user-plus'
};

/**
 * V4 color family per tile (keys match MainHeader ids). Replaces the v1
 * `common-*` color classes with v4 insight-card tint tokens. Full class-name
 * literals so Tailwind's content scanner keeps them.
 */
interface TileColor {
  bg: string;
  icon: string;
}
const V4_TILE_COLORS: Readonly<Record<string, TileColor>> = {
  blue: {
    bg: 'bg-v4-insight-card-background-blue',
    icon: 'text-v4-insight-card-icon-blue'
  },
  green: {
    bg: 'bg-v4-insight-card-background-green',
    icon: 'text-v4-insight-card-icon-green'
  },
  orange: {
    bg: 'bg-v4-insight-card-background-orange',
    icon: 'text-v4-insight-card-icon-orange'
  },
  purple: {
    bg: 'bg-v4-insight-card-background-purple',
    icon: 'text-v4-insight-card-icon-purple'
  }
};
const TILE_COLOR_FAMILY: Readonly<Record<string, keyof typeof V4_TILE_COLORS>> =
  {
    ach: 'blue',
    bank: 'green',
    bill: 'orange',
    blankChecks: 'green',
    multiChecks: 'blue',
    'user-cash': 'orange',
    checkDraft: 'purple',
    creditCard: 'orange',
    depositSlip: 'green',
    fundWallet: 'purple',
    importCheck: 'green',
    invoice: 'green',
    issueVisaCard: 'orange',
    mailCheck: 'blue',
    mailDocument: 'blue',
    mailDashboard: 'blue',
    multipleCheck: 'purple',
    payee: 'blue',
    paymentLink: 'green',
    positivePay: 'purple',
    shippingLabel: 'purple',
    user: 'blue'
  };

/**
 * One-line, plain-English description per tile (keys match MainHeader ids), shown as the
 * tile tooltip and matched by search. Written for a small-business owner, American English.
 */
const TILE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  ach: 'Send money straight to a bank account by ACH. Low cost, usually arrives in 1–3 business days.',
  bank: 'Connect a bank account so you can send and receive payments from it.',
  bill: 'Add a bill you owe. Track the due date and pay it when it is approved.',
  blankChecks: 'Print blank checks on your own printer and fill them in later.',
  multiChecks:
    'Pay many people at once. Type them in, import a spreadsheet, or use a saved template.',
  'user-cash': 'Record cash you spend or receive so your books stay accurate.',
  checkDraft:
    "Collect a payment from your customer's bank account with their permission. Print it or deposit it.",
  creditCard: "Add a credit card and pay vendors with it, even ones that don't take cards.",
  depositSlip:
    'Create, print, track and verify bank deposits. Select an account, add cash and checks, print, and take it to the bank. No pre-printed slips or waiting. Give employees role-based access.',
  fundWallet: 'Add money to your wallet so you can send payments from it.',
  importCheck: 'Upload a spreadsheet to create many checks in one step.',
  invoice: 'Create and send a professional invoice. Your customer can pay you online.',
  issueVisaCard: 'Create a Visa card for an employee or vendor, with spending limits you control.',
  mailCheck: 'Send a check by mail. We print, stamp and mail it, and you can track it.',
  mailDocument: "Upload any document and we'll print and mail it for you, with tracking.",
  mailDashboard: "See every check and document you've mailed and track its delivery.",
  multipleCheck: 'Write several checks on one screen and print them together.',
  payee: 'Add a person or business you pay, with their address and bank details.',
  paymentLink:
    'Create a link to get paid online. Share it by email or text, or add it to your website.',
  positivePay: 'Help stop check fraud: your bank only pays checks that match the ones you issued.',
  user: 'Invite a team member and choose what they can see and do.'
};

@Component({
  selector: 'app-favorites-drawer-v4',
  standalone: true,
  imports: [NgClass, LucideAngularModule, MatTooltipModule],
  templateUrl: './favorites-drawer-v4.component.html',
  styleUrl: './favorites-drawer-v4.component.scss'
})
export class FavoritesDrawerV4Component implements OnInit {
  private localStorageService = inject(LocalStorageService);
  private headerService = inject(HeaderService);
  private actions = inject(FavoriteCommonOnInitV4Service);
  private destroyRef = inject(DestroyRef);
  private postHogService = inject(PostHogService);

  readonly icons = v4LucideIconsMap;

  /** All quick-action tiles, alphabetically sorted (env filtering already applied by MainHeader). */
  readonly tiles: IHeaderLinks[] = MainHeader.headerDropdownLink().sort(
    (a, b) => a.title.localeCompare(b.title)
  );

  readonly isOpen = signal(false);
  readonly search = signal('');
  /** Manage-favorites mode: reveals every tile's star for deliberate pin/unpin (design Q4). */
  readonly manageMode = signal(false);
  /** Persisted favorite ids (favoriteIconId), ordered oldest → newest. */
  readonly favoriteIds = signal<number[]>([]);

  readonly favoriteTiles = computed(() => {
    const ids = this.favoriteIds();
    return ids
      .map((id) => this.tiles.find((t) => t.favoriteIconId === id))
      .filter((t): t is IHeaderLinks => !!t);
  });

  /** Which set the panel shows: every quick action, or only the pinned favorites. */
  readonly view = signal<'all' | 'favorites'>('all');

  readonly filteredTiles = computed(() => {
    const base = this.view() === 'favorites' ? this.favoriteTiles() : this.tiles;
    const term = this.search().trim().toLowerCase();
    if (!term) return base;
    return base.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        this.descriptionFor(t).toLowerCase().includes(term)
    );
  });

  readonly maxFavorites = MAX_FAVORITES;

  descriptionFor(tile: IHeaderLinks): string {
    return TILE_DESCRIPTIONS[tile.id] ?? '';
  }

  ngOnInit(): void {
    // Hydrate pinned favorites on load so the header pins render immediately.
    this.hydrateFavorites();
  }

  // ---- open / close -------------------------------------------------------

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(view: 'all' | 'favorites' = 'all'): void {
    this.hydrateFavorites();
    this.view.set(view);
    this.search.set('');
    this.manageMode.set(false);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.manageMode.set(false);
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  toggleManage(): void {
    this.manageMode.update((v) => !v);
  }

  // ---- favorites ----------------------------------------------------------

  /** Re-read the persisted favorites (header API mirrors them into localStorage). */
  private hydrateFavorites(): void {
    const stored = this.localStorageService.getItem('userQuickNavigationItems');
    const ids = Array.isArray(stored)
      ? stored
          .map((n: unknown) => Number(n))
          .filter((n: number) => !Number.isNaN(n))
      : [];
    // Keep newest N (oldest → newest order); drop extras from prior max-4 / v3 data.
    const trimmed = ids.slice(-MAX_FAVORITES);
    this.favoriteIds.set(trimmed);
    if (trimmed.length < ids.length) {
      this.localStorageService.setItem('userQuickNavigationItems', trimmed);
      this.headerService
        .setQuickNavFavorites(trimmed)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.headerService.setHeaderValueChanged(false),
          error: () => this.headerService.setHeaderValueChanged(false)
        });
    }
  }

  isFavorite(tile: IHeaderLinks): boolean {
    return (
      tile.favoriteIconId !== undefined &&
      this.favoriteIds().includes(tile.favoriteIconId)
    );
  }

  toggleFavorite(tile: IHeaderLinks, event: Event): void {
    event.stopPropagation();
    const favId = tile.favoriteIconId;
    if (favId === undefined) return;

    const current = [...this.favoriteIds()];
    const index = current.indexOf(favId);
    if (index === -1 && current.length < MAX_FAVORITES) {
      current.push(favId);
    } else if (index === -1 && current.length >= MAX_FAVORITES) {
      current.shift(); // oldest drops
      current.push(favId);
    } else {
      current.splice(index, 1);
    }

    this.postHogService.capture('v4_header_favorites_clicked');

    this.favoriteIds.set(current);
    this.localStorageService.setItem('userQuickNavigationItems', current);
    this.headerService
      .setQuickNavFavorites(current)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.headerService.setHeaderValueChanged(false),
        error: () => this.headerService.setHeaderValueChanged(false)
      });
  }

  // ---- actions ------------------------------------------------------------

  onPay(): void {
    this.close();
    this.actions.pay();
  }

  onRequest(): void {
    this.close();
    this.actions.request();
  }

  onTileClick(tile: IHeaderLinks): void {
    this.postHogService.capture('v4_header_favorites_clicked');
    this.close();
    this.dispatch(tile);
  }

  /** Route each tile to its v4 action (implemented in FavoriteCommonOnInitV4Service). */
  private dispatch(tile: IHeaderLinks): void {
    if (tile.requiresCustomAction) {
      switch (tile.id) {
        case 'ach':
          this.actions.ach();
          return;
        case 'importCheck':
          this.actions.importCheck();
          return;
        case 'blankChecks':
          this.actions.blankChecks();
          return;
        case 'shippingLabel':
          this.actions.shippingLabel();
          return;
        case 'positivePay':
          this.actions.positivePay();
          return;
        default:
          break;
      }
    }
    if (tile.v4RouterLink) {
      this.actions.navigateTo(tile.v4RouterLink);
      return;
    }
    this.actions.openByRouterLink(tile);
  }

  iconFor(tile: IHeaderLinks): unknown {
    return this.icons[TILE_ICONS[tile.id] ?? 'receipt'];
  }

  colorFor(tile: IHeaderLinks): TileColor {
    return V4_TILE_COLORS[TILE_COLOR_FAMILY[tile.id] ?? 'blue'];
  }
}

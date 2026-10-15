import {
  Component,
  ElementRef,
  HostBinding,
  ViewChild
} from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { LucideAngularModule } from 'lucide-angular';

export interface IBankDataV4FilterOption {
  value: string;
  name: string;
}

interface IPostdataFilterParams extends IFloatingFilterParams {
  /** Called live each render so async-loaded options appear once available. */
  getOptions?: () => IBankDataV4FilterOption[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
}

/**
 * v4-styled dropdown floating filter (mirrors V4DropdownFloatingFilterComponent's
 * look). Routes its selection to the tab via an `onSelect` callback to drive the
 * post-data block (filteredCategory / filteredBankAccounts) instead of the
 * standard ag-grid filterModel.
 */
@Component({
  selector: 'app-bank-data-v4-postdata-filter',
  standalone: true,
  imports: [FormsModule, NgClass, OverlayModule, LucideAngularModule],
  template: `
    <div class="v4-common-dropdown compact relative w-full font-peridot px-[1px]">
      <button
        type="button"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        #triggerEl
        (click)="toggleDropdown()"
        class="flex items-center w-full"
        [ngClass]="
          hasSelection
            ? 'border-v4-primary-brand-color text-v4-primary-brand-color'
            : ''
        "
      >
        <span
          class="flex-1 text-left truncate"
          [ngClass]="
            hasSelection
              ? 'text-v4-main-text-color'
              : 'text-v4-subtle-text-color'
          "
        >
          {{ displayLabel || placeholder }}
        </span>
        @if (hasSelection) {
          <span
            role="button"
            tabindex="0"
            (click)="clearSelection($event)"
            (keydown.enter)="clearSelection($event)"
            (keydown.space)="clearSelection($event); $event.preventDefault()"
            class="p-0.5 hover:bg-v4-tertiary-background-color rounded mr-1 cursor-pointer"
          >
            <lucide-icon
              name="x"
              [size]="10"
              class="text-v4-subtle-text-color"
            ></lucide-icon>
          </span>
        }
        <lucide-icon
          name="chevron-down"
          [size]="14"
          class="text-v4-subtle-text-color transition-transform"
          [ngClass]="isOpen ? 'rotate-180' : ''"
        ></lucide-icon>
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen"
        [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        (backdropClick)="closeDropdown()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayMinWidth]="240"
      >
        <div
          class="v4-common-dropdown-panel compact flex flex-col max-h-[240px]"
          style="min-width: 240px"
        >
          @if (searchable) {
            <div class="p-2 border-b border-v4-border-color">
              <div class="relative">
                <lucide-icon
                  name="search"
                  [size]="12"
                  class="absolute left-2 top-1/2 -translate-y-1/2 text-v4-subtle-text-color"
                ></lucide-icon>
                <input
                  type="text"
                  [(ngModel)]="searchTerm"
                  placeholder="Search..."
                  class="w-full pl-7 pr-2 py-1 text-xs border border-v4-input-border-color rounded focus:outline-none focus:ring-1 focus:ring-v4-brand-focus-color bg-v4-secondary-background-color text-v4-main-text-color"
                />
              </div>
            </div>
          }

          <div class="overflow-y-auto flex-1">
            <!-- All option -->
            <div
              role="button"
              tabindex="0"
              class="v4-dropdown-item gap-2"
              [class.selected]="!hasSelection"
              (click)="selectOption(null)"
              (keydown.enter)="selectOption(null)"
              (keydown.space)="selectOption(null); $event.preventDefault()"
            >
              <span class="truncate">All</span>
              @if (!hasSelection) {
                <lucide-icon
                  name="check"
                  [size]="12"
                  class="ml-auto"
                ></lucide-icon>
              }
            </div>

            @for (option of filteredOptions; track option.value) {
              <div
                role="button"
                tabindex="0"
                class="v4-dropdown-item gap-2"
                [class.selected]="isSelected(option)"
                (click)="selectOption(option)"
                (keydown.enter)="selectOption(option)"
                (keydown.space)="selectOption(option); $event.preventDefault()"
              >
                <span class="truncate" [innerHTML]="option.name"></span>
                @if (isSelected(option)) {
                  <lucide-icon
                    name="check"
                    [size]="12"
                    class="ml-auto"
                  ></lucide-icon>
                }
              </div>
            }

            @if (filteredOptions.length === 0) {
              <div
                class="px-2 py-3 text-xs text-v4-tertiary-text-color text-center"
              >
                No options found
              </div>
            }
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class BankDataV4PostdataFilterComponent
  implements AgFloatingFilterComponent
{
  @HostBinding('class') hostClass = 'w-full';

  @ViewChild('triggerEl', { static: true }) triggerEl!: ElementRef<HTMLElement>;

  params!: IPostdataFilterParams;
  options: IBankDataV4FilterOption[] = [];
  selectedValue: string | null = null;
  displayLabel = '';
  hasSelection = false;
  isOpen = false;
  searchable = true;
  searchTerm = '';
  placeholder = 'All';

  overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 2
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 2
    }
  ];

  agInit(params: IPostdataFilterParams): void {
    this.params = params;
    if (params.placeholder) this.placeholder = params.placeholder;
    this.searchable = params.searchable ?? true;
    this.refreshOptions();
  }

  // Required by ag-grid floating filter contract.
  onParentModelChanged(): void {}

  refreshOptions(): void {
    this.options = this.params?.getOptions?.() ?? [];
  }

  get filteredOptions(): IBankDataV4FilterOption[] {
    if (!this.searchTerm) return this.options;
    const term = this.searchTerm.toLowerCase();
    return this.options.filter((o) => o.name.toLowerCase().includes(term));
  }

  toggleDropdown(): void {
    if (!this.isOpen) this.refreshOptions();
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.searchTerm = '';
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }

  isSelected(option: IBankDataV4FilterOption): boolean {
    return this.hasSelection && this.selectedValue === option.value;
  }

  selectOption(option: IBankDataV4FilterOption | null): void {
    if (!option) {
      this.selectedValue = null;
      this.hasSelection = false;
      this.displayLabel = '';
    } else {
      this.selectedValue = option.value;
      this.hasSelection = true;
      this.displayLabel = this.toLabel(option.name);
    }
    this.isOpen = false;
    this.searchTerm = '';
    this.params?.onSelect?.(this.selectedValue ?? '');
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectOption(null);
  }

  /** Strip leading indentation (\s also matches non-breaking spaces) for the trigger label. */
  private toLabel(name: string): string {
    return (name || '').replace(/^\s+/, '');
  }
}

import {
  Component,
  ElementRef,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { IReceivedTypes } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

interface IRCOption {
  value: number | { type: number; status: number };
  name: string;
}

@Component({
  selector: 'app-v4-rc-select-box',
  standalone: true,
  imports: [NgClass, OverlayModule, LucideAngularModule],
  template: `
    <div class="relative w-full font-peridot px-[2px]">
      <button
        type="button"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        #triggerEl
        (click)="toggleDropdown()"
        class="flex items-center w-full h-7 px-2 py-1 border rounded-md text-[12px] hover:bg-v4-tertiary-background-color focus:outline-none focus:ring-1 focus:ring-v4-brand-focus-color"
        [ngClass]="
          hasSelection
            ? 'bg-v4-brand-tint border-v4-primary-brand-color/30 text-v4-primary-brand-bold-color'
            : 'bg-v4-secondary-background-color border-v4-input-border-color text-v4-main-text-color'
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
          {{ displayLabel || 'All' }}
        </span>
        @if (hasSelection) {
          <span
            role="button"
            tabindex="0"
            (click)="resetFilter($event)"
            (keydown.enter)="resetFilter($event)"
            (keydown.space)="resetFilter($event); $event.preventDefault()"
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
        [cdkConnectedOverlayMinWidth]="overlayWidth || 180"
        [cdkConnectedOverlayWidth]="overlayWidth || 180"
      >
        <div
          class="bg-v4-popup-background-color border border-v4-border-color rounded shadow-lg overflow-hidden flex flex-col max-h-[200px] w-full box-border"
        >
          <div class="overflow-y-auto flex-1">
            <!-- All option -->
            <div
              role="button"
              tabindex="0"
              class="px-2 py-1.5 cursor-pointer text-xs flex items-center gap-2 hover:bg-v4-brand-tint"
              [ngClass]="
                !hasSelection
                  ? 'bg-v4-brand-tint text-v4-primary-brand-bold-color'
                  : 'text-v4-main-text-color'
              "
              (click)="selectOption(null)"
              (keydown.enter)="selectOption(null)"
              (keydown.space)="selectOption(null); $event.preventDefault()"
            >
              <span class="truncate">All</span>
              @if (!hasSelection) {
                <lucide-icon
                  name="check"
                  [size]="12"
                  class="ml-auto text-v4-primary-brand-bold-color"
                ></lucide-icon>
              }
            </div>

            @for (option of options; track option.name) {
              <div
                role="button"
                tabindex="0"
                class="px-2 py-1.5 cursor-pointer text-xs flex items-center gap-2 hover:bg-v4-brand-tint"
                [ngClass]="
                  selectedOption === option
                    ? 'bg-v4-brand-tint text-v4-primary-brand-bold-color'
                    : 'text-v4-main-text-color'
                "
                (click)="selectOption(option)"
                (keydown.enter)="selectOption(option)"
                (keydown.space)="selectOption(option); $event.preventDefault()"
              >
                <span class="truncate">{{ option.name }}</span>
                @if (selectedOption === option) {
                  <lucide-icon
                    name="check"
                    [size]="12"
                    class="ml-auto text-v4-primary-brand-bold-color"
                  ></lucide-icon>
                }
              </div>
            }
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class V4RCSelectBoxComponent
  implements AgFloatingFilterComponent, OnInit, OnDestroy
{
  @HostBinding('class') hostClass = 'w-full';

  private requestPaymentsService = inject(RequestPaymentsService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  params: IFloatingFilterParams;
  isOpen = false;
  hasSelection = false;
  displayLabel = '';
  selectedOption: IRCOption | null = null;
  overlayWidth = 0;

  @ViewChild('triggerEl', { static: true }) triggerEl!: ElementRef<HTMLElement>;

  private subscriptions: Subscription[] = [];
  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

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

  options: IRCOption[] = [
    { value: 1, name: 'Email' },
    { value: 14, name: 'Requested' },
    { value: { type: 4, status: 1 }, name: 'GPBL Pending' },
    { value: { type: 4, status: 2 }, name: 'GPBL Viewed' },
    { value: { type: 4, status: 3 }, name: 'GPBL Rejected' },
    { value: { type: 4, status: 4 }, name: 'GPBL Accepted' },
    { value: { type: 4, status: 5 }, name: 'GPBL TTP' },
    { value: { type: 4, status: 6 }, name: 'GPBL Printed' },
    { value: { type: 4, status: 7 }, name: 'HTML-FORM-SENDER-FPRINTED' },
    { value: { type: 4, status: 30 }, name: 'GPBL DD' },
    { value: { type: 4, status: 32 }, name: 'DD Rejected' },
    { value: { type: 4, status: 50 }, name: 'DD Initiated' },
    { value: { type: 4, status: 51 }, name: 'DD Completed' },
    { value: { type: 4, status: 52 }, name: 'DD Failed' },
    { value: 5, name: 'ACH' },
    { value: 6, name: 'M-ACH' },
    { value: 10, name: 'Stripe' },
    { value: 11, name: 'Paypal' }
  ];

  onParentModelChanged(): void {}

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
  }

  ngOnInit(): void {
    this.setCellFilter();
    this.subscriptions.push(
      this.v3DataTableService.switchPaymentTableTab$.subscribe((res) => {
        if (res) {
          this.selectedOption = null;
          this.hasSelection = false;
          this.displayLabel = '';
          this.isOpen = false;
          this.requestPaymentsService.setReceivedTypes(undefined);
        }
      })
    );
  }

  toggleDropdown(): void {
    // Measure on open — the column can be resized between opens, and the
    // backdrop blocks resizing while the panel is up, so this stays accurate.
    if (!this.isOpen) {
      this.overlayWidth = this.triggerEl?.nativeElement?.offsetWidth || 0;
    }
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  selectOption(option: IRCOption | null): void {
    if (option === null) {
      this.resetFilter();
      return;
    }

    this.selectedOption = option;
    this.hasSelection = true;
    this.displayLabel = option.name;
    this.isOpen = false;

    this.params.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged(null, null);
    });
    this.requestPaymentsService.setReceivedTypes(
      option.value as unknown as IReceivedTypes
    );
  }

  resetFilter(event?: Event): void {
    event?.stopPropagation();
    this.selectedOption = null;
    this.hasSelection = false;
    this.displayLabel = '';
    this.isOpen = false;

    this.params.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged(null, null);
    });
    this.requestPaymentsService.setReceivedTypes(
      ' ' as unknown as IReceivedTypes
    );
    this.v3DataTableService.gridApi?.deselectAll();
  }

  private setCellFilter(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (
          res?.field === this.params.column.getColDef()?.headerName &&
          res?.filter
        ) {
          const filterValue: {
            receivedType: number;
            statusValue: number;
          } = JSON.parse(res.filter);

          const match = this.options.find((option) => {
            if (typeof option.value === 'number') {
              return option.value === Number(filterValue.receivedType);
            }
            return (
              option.value.type === Number(filterValue.receivedType) &&
              option.value.status === Number(filterValue.statusValue)
            );
          });

          if (match) {
            this.selectOption(match);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

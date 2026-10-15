import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faCircleExclamation,
  faCircleInfo,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import {
  ICheckShipingTypes,
  IMailingSettingsActivities
} from '../../model/check';

@Component({
  selector: 'app-check-mail-settings-modal',
  standalone: true,
  imports: [
    FaIconComponent,
    MatDialogClose,
    FormsModule,
    NgClass,
    MatTooltip,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './check-mail-settings-modal-v4.component.html',
  styleUrl: './check-mail-settings-modal-v4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckMailSettingsModalV4Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<CheckMailSettingsModalV4Component>);
  private localStorageService = inject(LocalStorageService);
  private data = inject(MAT_DIALOG_DATA) as { id: string };

  destroy$ = new Subject();
  usDefaultShippingName = '';
  usShippingNameForAll = signal<string>('');
  caDefaultShippingName = '';
  totalPage = 0;
  initialCount = 1;
  pageArr: (number | string)[] = [];
  initialPage = 1;
  mode = 1;
  selectedValue!: number;
  paginationPage: number = 1;
  pseudoI!: number;
  auditLogData: IMailingSettingsActivities[] = [];
  auditLog = signal<IMailingSettingsActivities[]>([]);
  usShippingTypes = signal<ICheckShipingTypes[]>([]);
  caShippingTypes = signal<ICheckShipingTypes[]>([]);
  isLoading = signal(false);
  isLoadingDefaultType = signal(false);
  isSubmit = signal(false);
  showActivity = signal(false);
  faXmark = faXmark;
  faAngleRight = faAngleRight;
  faAngleLeft = faAngleLeft;
  faInfo = faCircleInfo;
  faRequired = faCircleExclamation;
  selectShippingTypeForAll = signal<boolean>(false);
  isRequired = signal<boolean>(false);

  ngOnInit(): void {
    this.getAuditLog();
    this.getShippingType();
    if (this.data?.id === 'select-shipping') {
      this.selectShippingTypeForAll.set(true);
    }
  }

  getShippingType() {
    this.isLoadingDefaultType.set(true);
    this.checkService
      .getShippingType()
      .pipe(
        finalize(() => {
          this.isLoadingDefaultType.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.success && res.data.length) {
          this.setShippingList(res.data);
        }
      });
  }

  /**
   * Sets the default shipping type for US and Canada from the list of all shipping types available.
   * @param List - Array of all shipping types available.
   */
  setShippingList(List: ICheckShipingTypes[]) {
    const usTypes = List.filter(
      (ele) => ele.country !== 'Canada' && ele.country !== 'International'
    );
    const defaultType = usTypes.find((ele) => ele.is_default_mailing_type);
    this.usDefaultShippingName = defaultType?.name || usTypes[0]?.name || '';
    this.usShippingTypes.set(usTypes);
    const caTypes = List.filter((ele) => ele.country === 'Canada');
    const defaultCaType = caTypes.find((ele) => ele.is_default_mailing_type);
    this.caDefaultShippingName = defaultCaType?.name || caTypes[0]?.name || '';
    this.caShippingTypes.set(caTypes);

    // Resolve stored preferredShippingType id to name
    if (this.selectShippingTypeForAll()) {
      const storedId = this.localStorageService.getItem(
        'preferredShippingType'
      );
      if (storedId) {
        const match = usTypes.find((t) => t.id === Number(storedId));
        if (match) {
          this.usShippingNameForAll.set(match.name);
        }
      }
    }
  }

  getAuditLog() {
    this.isLoading.set(true);
    this.checkService
      .getMailingSettingsActivities()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.success && res?.data.length > 0) {
          this.auditLogData = res.data;
          this.totalPage = Math.ceil(this.auditLogData.length / 4);
          const start = 0; // For the first page
          const end = 4; // Display 5 items per page
          const slicedLogs = this.auditLogData.slice(start, end);
          this.auditLog.set(slicedLogs);

          this.paginationArray();
        }
      });
  }

  updateShippingTypeForAll(value: string) {
    this.isRequired.set(false);
    this.usShippingNameForAll.set(value);
    const selectedType = this.usShippingTypes().find((t) => t.name === value);
    this.localStorageService.setItem(
      'preferredShippingType',
      selectedType?.id ?? 0
    );
  }

  private getIdByName(name: string, types: ICheckShipingTypes[]): number {
    return types.find((t) => t.name === name)?.id ?? 0;
  }

  submit() {
    if (this.data && this.data.id === 'select-shipping') {
      this.isRequired.set(true);
      const selectedId = this.getIdByName(
        this.usShippingNameForAll(),
        this.usShippingTypes()
      );
      if (this.usShippingNameForAll() && selectedId !== 0) {
        this.isSubmit.set(true);
        this.dialogRef.close(selectedId);
      }
    } else {
      this.isSubmit.set(true);
      const payload = {
        default_mailing_type_us: this.getIdByName(
          this.usDefaultShippingName,
          this.usShippingTypes()
        ),
        default_mailing_type_canada: this.getIdByName(
          this.caDefaultShippingName,
          this.caShippingTypes()
        )
      };
      this.checkService
        .setDafaultMailingType(payload)
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Default shipping type updated successfully!'
            });
            this.dialogRef.close(true);
          }
        });
    }
  }

  /**
   * Generates an array for pagination control based on the current mode.
   * @method
   */
  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  /**
   * Moves to the previous page of notifications.
   * @method
   */
  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getNextItems(this.initialPage);
    }
  }

  /**
   * Moves to the next page of notifications.
   * @method
   */
  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getNextItems(this.initialPage);
    }
  }

  /**
   * Navigates to a specific page of notifications.
   * @method
   * @param {number | string} item - The page number to navigate to.
   */
  gotoPage(page: number | string) {
    const item = Number(page);
    if (item > 0) {
      this.initialPage = item;
      if (item < this.initialCount + 4) {
        this.mode = 1;
        this.paginationArray();
      } else if (item > this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }

    this.getNextItems(item);
  }

  getNextItems(num: number) {
    this.auditLog.set([]);
    this.paginationPage = num;
    const start = num * 4 - 4;
    const end = num * 4;
    const slicedLogs = this.auditLogData.slice(start, end);
    this.auditLog.set(slicedLogs);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

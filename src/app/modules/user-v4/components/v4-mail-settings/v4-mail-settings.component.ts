import { NgClass, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Save,
  Loader,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Search,
  FileText
} from 'lucide-angular';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  IMailingSettingsActivities,
  ICheckShipingTypes
} from 'src/app/modules/check/model/check';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-mail-settings',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    UpperCasePipe,
    LucideAngularModule,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component
  ],
  templateUrl: './v4-mail-settings.component.html',
  styleUrl: './v4-mail-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4MailSettingsComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);

  readonly SaveIcon = Save;
  readonly LoaderIcon = Loader;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly GlobeIcon = Globe;
  readonly ClockIcon = Clock;
  readonly SearchIcon = Search;
  readonly FileTextIcon = FileText;

  destroy$ = new Subject();
  usDefaultShippingType = 1;
  caDefaultShippingType = 14;
  selectedUsShipping: string;
  selectedCaShipping: string;
  totalPage = 0;
  initialCount = 1;
  pageArr: (number | string)[] = [];
  initialPage = 1;
  mode = 1;
  selectedValue!: number;
  paginationPage: number = 1;
  pseudoI!: number;
  auditLogData: IMailingSettingsActivities[] = [];
  filteredAuditLogData: IMailingSettingsActivities[] = [];
  auditLog = signal<IMailingSettingsActivities[]>([]);
  hasAuditData = signal(false);
  usShippingTypes = signal<ICheckShipingTypes[]>([]);
  caShippingTypes = signal<ICheckShipingTypes[]>([]);
  isLoadingDefaultType = signal(false);
  isSubmit = signal(false);
  searchTerm = '';

  ngOnInit(): void {
    this.getAuditLog();
    this.getShippingType();
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

  setShippingList(List: ICheckShipingTypes[]) {
    const usTypes = List.filter(
      (ele) => ele.country !== 'Canada' && ele.country !== 'International'
    );
    const defaultType = usTypes.find((ele) => ele.is_default_mailing_type);
    this.usDefaultShippingType = defaultType?.id || 1;
    this.selectedUsShipping = JSON.stringify(defaultType || usTypes[0]);
    this.usShippingTypes.set(usTypes);
    const caTypes = List.filter((ele) => ele.country === 'Canada');
    const defaultCaType = caTypes.find((ele) => ele.is_default_mailing_type);
    this.caDefaultShippingType = defaultCaType?.id || 14;
    this.selectedCaShipping = JSON.stringify(defaultCaType || caTypes[0]);
    this.caShippingTypes.set(caTypes);
  }

  onUsShippingChange(val: string) {
    try {
      const obj = JSON.parse(val);
      this.usDefaultShippingType = obj.id;
    } catch {
      //
    }
  }

  onCaShippingChange(val: string) {
    try {
      const obj = JSON.parse(val);
      this.caDefaultShippingType = obj.id;
    } catch {
      //
    }
  }

  getAuditLog() {
    this.checkService
      .getMailingSettingsActivities()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.success && res?.data.length > 0) {
          this.auditLogData = res.data;
          this.filteredAuditLogData = res.data;
          this.hasAuditData.set(true);
          this.totalPage = Math.ceil(this.filteredAuditLogData.length / 3);
          const start = 0;
          const end = 3;
          const slicedLogs = this.filteredAuditLogData.slice(start, end);
          this.auditLog.set(slicedLogs);

          this.paginationArray();
        }
      });
  }

  submit() {
    this.isSubmit.set(true);
    const payload = {
      default_mailing_type_us: this.usDefaultShippingType,
      default_mailing_type_canada: this.caDefaultShippingType
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
        }
      });
  }

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

  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getNextItems(this.initialPage);
    }
  }

  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getNextItems(this.initialPage);
    }
  }

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

  onSearchChange() {
    const term = this.searchTerm.toLowerCase();
    this.filteredAuditLogData = term
      ? this.auditLogData.filter(
          (item) =>
            item.userName?.toLowerCase().includes(term) ||
            item.note?.toLowerCase().includes(term) ||
            item.ip_address?.toLowerCase().includes(term)
        )
      : this.auditLogData;
    this.paginationPage = 1;
    this.initialPage = 1;
    this.mode = 1;
    this.totalPage = Math.ceil(this.filteredAuditLogData.length / 3);
    this.auditLog.set(this.filteredAuditLogData.slice(0, 3));
    this.paginationArray();
  }

  getNextItems(num: number) {
    this.auditLog.set([]);
    this.paginationPage = num;
    const start = num * 3 - 3;
    const end = num * 3;
    const slicedLogs = this.filteredAuditLogData.slice(start, end);
    this.auditLog.set(slicedLogs);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

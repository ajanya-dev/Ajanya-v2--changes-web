import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  OnInit,
  inject
} from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { UserService } from 'src/app/shared/service/user/user.service';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDropListGroup,
  CdkDropList,
  CdkDrag
} from '@angular/cdk/drag-drop';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { FormsModule } from '@angular/forms';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import {
  LucideAngularModule,
  Save,
  Loader,
  GripVertical,
  Info
} from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { TAB_ORDER_TEXT_V4 } from 'src/app/shared/utils/tab-order-text.util';
import { IUserTab } from '../../../user/model/user';
import { V4TabOrderPreviewComponent } from './v4-tab-order-preview/v4-tab-order-preview.component';

@Component({
  selector: 'app-v4-checklist-settings',
  templateUrl: './v4-checklist-settings.component.html',
  styleUrls: ['./v4-checklist-settings.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    V4CommonDropDownSelectorComponent,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component,
    V4TabOrderPreviewComponent
  ]
})
export class V4ChecklistSettingsComponent implements OnInit, OnDestroy {
  public userService = inject(UserService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);

  @Input() set checkListObg(val: {
    allTabs: { name: string; number: number }[];
    selectedTabs: [];
    pageOriantation: number;
    checkListTab: number;
    unselectedTabs: [];
  }) {
    this.checkListTab = val.allTabs;
    this.selectedTabs = val.selectedTabs;
    this.unselectedTabs = val.unselectedTabs;
    this.pageOrientation = val.pageOriantation;
    this.selectedPrintingStyle = JSON.stringify(
      this.printingStyle.find((el) => el.value === val.pageOriantation)
    );

    this.selectedCheckList = JSON.stringify(
      (val.allTabs ?? []).find((el) => el.number === val.checkListTab)
    );
    this.syncDefaultTabNumber(this.selectedCheckList);
  }

  @Output() refresh = new EventEmitter();

  selectedOrieO = '';
  selectedDefTab = '';
  isSaveG = false;
  destroy$ = new Subject<boolean>();

  selectedOption: string;
  selectedItem: { id: number; name: string; url: string } | undefined;
  isLoading = false;

  readonly SaveIcon = Save;
  readonly LoaderIcon = Loader;
  readonly GripVerticalIcon = GripVertical;
  readonly InfoIcon = Info;

  readonly tabOrderText = TAB_ORDER_TEXT_V4;

  /** Default check list tab id, mirrored for the read-only preview only. */
  defaultTabNumber: number | null = null;

  printingStyle = [
    { value: 1, name: 'Check On Top' },
    { value: 4, name: 'Three Per Page' },
    { value: 5, name: 'Wallet Size' },
    { value: 2, name: 'Check On Middle' },
    { value: 3, name: 'Check On Bottom' }
  ];

  landingPage = [
    { id: 9, name: 'Dashboard', url: '/manage/home' },
    { id: 10, name: 'Check', url: '/manage/payments-out/detailed/check' },
    { id: 11, name: 'Payments Out', url: '/manage/payments-out/detailed/all' },
    { id: 12, name: 'Bank Accounts', url: '/manage/bank-accounts/index' },
    { id: 13, name: 'Wallets', url: '/manage/wallets' },
    { id: 14, name: 'My Cards', url: '/manage/cards' },
    { id: 15, name: 'Vendors', url: '/manage/payees' },
    { id: 16, name: 'Customers', url: '/manage/payees?type=customer' },
    { id: 17, name: 'Employees', url: '/manage/payees?type=employee' }
  ];

  checkListTab: { name: string; number: number }[] = [];
  selectedTabs: { name: string; number: number }[] = [];
  unselectedTabs: { name: string; number: number }[] = [];
  pageOrientation: number;

  selectedLandingPage: string;
  selectedPrintingStyle: string;
  selectedCheckList: string;

  ngOnInit(): void {
    this.loadedHeaderDataAndProcess();
    this.selectedOption = this.localStorageService.getItem('defaultPage');

    this.selectedLandingPage = JSON.stringify(
      this.landingPage.find((el) => el.url === this.selectedOption)
    );

    this.selectedItem = this.landingPage.find(
      (item) => item.url === this.selectedOption
    );
  }

  loadedHeaderDataAndProcess() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData.subscribe((headerData) => {
      if (headerData && headerData.personalInfo?.isLegalEnabled) {
        this.enableLegalCheckTemplate();
      }
    });
  }

  enableLegalCheckTemplate() {
    this.printingStyle.push({ value: 100, name: 'Legal' });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  updateTab() {
    this.isSaveG = true;
    this.isLoading = true;
    const selectedTabId = Number(JSON.parse(this.selectedCheckList).number);
    if (!this.selectedTabs.some((tab) => tab.number === selectedTabId)) {
      const selectedTab = this.unselectedTabs.find(
        (tab) => tab.number === selectedTabId
      );
      if (selectedTab) {
        this.selectedTabs.push(selectedTab);
        this.unselectedTabs = this.unselectedTabs.filter(
          (tab) => tab.number !== selectedTabId
        );
      }
    }

    const selectedArray: number[] = [];
    this.selectedTabs.forEach((element: IUserTab) => {
      selectedArray.push(element.number);
    });

    const data = {
      tab_order: selectedArray
    };
    this.userService
      .updateTabs(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isSaveG = false;
        if (this.selectedItem) {
          this.onSubmitDefaultScreen();
        }
        if (res.success && !this.selectedItem) {
          this.isLoading = false;
          this.successAlert();
        }
      });
  }

  successAlert() {
    this.alertService.successAlert({
      title: 'Success',
      content: 'Updated',
      close: true
    });
  }

  landingPageChange(val: string) {
    try {
      const obj = JSON.parse(val);
      this.selectedItem = this.landingPage.find(
        (item) => item.url === obj?.url
      );
    } catch {
      //
    }
  }

  printingStyleChange(val: string) {
    try {
      const { value } = JSON.parse(val);

      this.selectedOrieO = `${value}`;

      const data1 = {
        designTemplete:
          this.selectedOrieO === '' ? this.pageOrientation : this.selectedOrieO
      };

      this.userService
        .updateCheckTemplate(data1)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refresh.emit('changed');
          this.successAlert();
        });
    } catch {
      //
    }
  }

  checkListChange(val: string) {
    this.syncDefaultTabNumber(val);
    try {
      const { number: value } = JSON.parse(val);

      this.selectedDefTab = `${value}`;

      const data2 = {
        checkListTab:
          this.selectedDefTab === '' ? this.checkListTab : this.selectedDefTab
      };

      this.userService
        .updateCheckTab(data2)

        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          const selectedTabId = Number(
            JSON.parse(this.selectedCheckList).number
          );
          if (!this.selectedTabs.some((tab) => tab.number === selectedTabId)) {
            const selectedTab = this.unselectedTabs.find(
              (tab) => tab.number === selectedTabId
            );

            if (selectedTab) {
              this.selectedTabs.push(selectedTab);
              this.unselectedTabs = this.unselectedTabs.filter(
                (tab) => tab.number !== selectedTabId
              );
              this.updateTab();
            } else {
              this.successAlert();
            }
          }
        });
    } catch {
      //
    }
  }

  /**
   * Presentation only: mirrors the selected default tab id so the preview can
   * highlight it. Never feeds the save payload.
   */
  private syncDefaultTabNumber(val: string): void {
    try {
      const { number: value } = JSON.parse(val);
      this.defaultTabNumber = typeof value === 'number' ? value : null;
    } catch {
      this.defaultTabNumber = null;
    }
  }

  onSubmitDefaultScreen() {
    this.userService
      .setUserLandingPage({
        number: this.selectedItem?.id as number,
        url: this.selectedItem?.url as string
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.successAlert();
          this.localStorageService.setItem(
            'defaultPage',
            this.selectedItem?.url
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

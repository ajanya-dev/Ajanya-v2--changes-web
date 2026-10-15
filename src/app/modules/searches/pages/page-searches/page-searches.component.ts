import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import {
  faChevronRight,
  faMagnifyingGlass
} from '@fortawesome/pro-solid-svg-icons';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { SearchAreas } from 'src/app/data/data/globalSearch';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { JsonPipe, NgIf, NgOptimizedImage } from '@angular/common';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { environment } from 'src/environments/environment';
import { BlankCheckModalComponent } from '../../../check/components/create-blank-check-modal/blank-check-modal.component';

interface ISearchPagesCardData {
  icon: string;
  name: string;
  routingLink?: string;
  outsideLink?: string | undefined;
  onClick?: string | undefined;
}

@Component({
  selector: 'app-page-searches',
  templateUrl: './page-searches.component.html',
  styleUrls: ['./page-searches.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    RouterLink,
    NgIf,
    FontAwesomeModule,
    FormsModule,
    JsonPipe,
    SearchFilterPipe,
    NgOptimizedImage
  ]
})
export class PageSearchesComponent implements OnInit, OnDestroy {
  public sharedService = inject(SharedService);
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private dataTableService = inject(DataTableService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private commonOnInitService = inject(CommonOnInitService);

  faMagnifyingGlass = faMagnifyingGlass;
  faChevronRight = faChevronRight;

  searchPagesCard: ISearchPagesCardData[] = SearchAreas.searchPages();
  term: string;
  searchValue: string;
  search = false;
  resultFound = true;
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  /**
   * Initializes the component by calling the `whiteLabelSettings` method.
   */
  ngOnInit(): void {
    this.whiteLabelSettings();
  }


  /**
   * Handles search input changes and triggers MoEngage tracking.
   */
  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  /**
   * Modifies the `searchPagesCard` array based on certain white label conditions.
   *
   * This function checks if `StaticWhiteLabelConditions.zohoSupportChat` is falsy.
   * If it is falsy, it iterates through the `searchPagesCard` array and removes any elements
   * with the name 'Support: Live Chat'.
   */
  whiteLabelSettings(): void {
    if (this.isArcharina) {
      this.searchPagesCard = this.searchPagesCard.filter(
        (v) =>
          v.name !== 'Support: Knowledge Base' &&
          v.name !== 'Support: Contact Us'
      );
    }

    if (!StaticWhiteLabelConditions.zohoSupportChat) {
      this.searchPagesCard = this.searchPagesCard.filter(
        (v) => v.name !== 'Support: Live Chat'
      );
    }
    if (
      !this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isZilBankAdShown'
      )
    ) {
      this.searchPagesCard = this.searchPagesCard.filter(
        (v) => v.name !== 'Cloud Bank'
      );
    }
  }

  /**
   * Handle click events for various search-related actions.
   *
   * @param {string} clickedPage - The clicked page or action to perform.
   */

  onSearchClick(clickedPage: string | undefined): void {
    this.search = !this.search;

    switch (clickedPage) {
      case 'blankCheck':
        this.openBlankCheckModal();
        break;
      case 'addBank':
        this.openBankAccModal();
        break;
      case 'cloudBank':
        this.router.navigateByUrl('/manage/cloud-bank/index');
        break;
      case 'positivePay':
        this.commonOnInitService.checkPostivePayPermission();
        break;
      default:
        break;
    }
  }

  /**
   * Open the Blank Check Modal.
   */
  openBlankCheckModal(): void {
    this.router.navigate(['/manage/cheque/checkrecords']);

    const dialogRef = this.dialog.open(BlankCheckModalComponent, {
      maxWidth: '450px',
      width: '93%',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   *  Add new bank account routing
   */
  openBankAccModal(): void {
    this.router.navigate(['/manage/users/add-bank-manually']);
  }

  /**
   * Navigate to an external URL in a new browser window/tab.
   *
   * @param {string} url - The URL to navigate to.
   */
  navigateOutside(url: string | undefined): void {
    if (url) window.open(url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

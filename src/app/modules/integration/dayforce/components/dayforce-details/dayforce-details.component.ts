import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { finalize, take } from 'rxjs';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faBroomWide,
  faPenToSquare,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { IDayforceLocations } from '../../model/dayforce';
import { DayforceMapModalComponent } from '../../modals/dayforce-map-modal/dayforce-map-modal.component';

@Component({
  selector: 'app-dayforce-details',
  standalone: true,
  imports: [CommonButtonV35Component, FaIconComponent, MatTooltip],
  templateUrl: './dayforce-details.component.html',
  styleUrl: './dayforce-details.component.scss'
})
export class DayforceDetailsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  public payeeDataService = inject(PayeeDataV35Service);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);

  itsSubCompany = input<boolean>(false);
  importedLocations = signal<IDayforceLocations[]>([]);
  isLocationsLoading = signal(false);
  locationImporting = signal(false);
  isClearingLocation = signal({});
  isDeletingLocation = signal({});

  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;
  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faBroomWide = faBroomWide;
  faSpinner = faSpinner;

  // Pagination
  perPageOptions = [50, 100];
  currentPage = signal(1);
  perPage = signal(50);

  totalLocations = computed(() => this.importedLocations().length);
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalLocations() / this.perPage()))
  );

  paginatedLocations = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage();
    return this.importedLocations().slice(start, start + this.perPage());
  });

  paginationFrom = computed(() => {
    if (this.totalLocations() === 0) return 0;
    return (this.currentPage() - 1) * this.perPage() + 1;
  });

  paginationTo = computed(() =>
    Math.min(this.currentPage() * this.perPage(), this.totalLocations())
  );

  ngOnInit(): void {
    this.getImportedLocations();
  }

  getImportedLocations() {
    this.locationImporting.set(true);
    this.integrationService
      .getDayforceLocations()
      .pipe(
        finalize(() => {
          this.locationImporting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.importedLocations.set(res.data);
          this.currentPage.set(1);
        }
      });
  }

  importLocations() {
    this.isLocationsLoading.set(true);
    this.integrationService
      .importDayforceLocations()
      .pipe(
        finalize(() => {
          this.isLocationsLoading.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully imported locations.'
          });
          this.getImportedLocations();
        }
      });
  }

  importPayees() {
    this.payeeDataService.importFromDayForce();
  }

  onMapNow(location: IDayforceLocations): void {
    const dialogRef = this.dialog.open(DayforceMapModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        location,
        itsSubCompany: this.itsSubCompany() || false
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getImportedLocations();
      }
    });
  }

  onClearLocation(location: IDayforceLocations): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to clear the location mapping?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.isClearingLocation.set({
            ...this.isClearingLocation(),
            [location.id]: true
          });
          this.integrationService
            .clearDayforceLocation({ locationId: location.id })
            .pipe(
              finalize(() => {
                this.isClearingLocation.set({
                  ...this.isClearingLocation(),
                  [location.id]: false
                });
              }),
              take(1)
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  content: 'Successfully cleared location mapping.'
                });
                this.getImportedLocations();
              }
            });
        }
      });
  }

  onDeleteLocation(location: IDayforceLocations): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete the location mapping?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.isDeletingLocation.set({
            ...this.isDeletingLocation(),
            [location.id]: true
          });
          this.integrationService
            .deleteDayforceLocation({ locationId: location.id })
            .pipe(
              finalize(() => {
                this.isDeletingLocation.set({
                  ...this.isDeletingLocation(),
                  [location.id]: false
                });
              }),
              take(1)
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  content: 'Successfully deleted location mapping.'
                });
                this.getImportedLocations();
              }
            });
        }
      });
  }

  // Pagination methods
  onPerPageChange(value: number): void {
    this.perPage.set(value);
    this.currentPage.set(1);
  }

  onPageChange(direction: 'prev' | 'next'): void {
    const page =
      direction === 'next' ? this.currentPage() + 1 : this.currentPage() - 1;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  gotoPage(page: number | string): void {
    const pageNum = Number(page);
    if (pageNum >= 1 && pageNum <= this.totalPages()) {
      this.currentPage.set(pageNum);
    }
  }

  onPageInput(event: Event): void {
    const inputValue = event.target as HTMLInputElement;
    let pageNum = parseInt(inputValue.value, 10);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    } else if (pageNum > this.totalPages()) {
      pageNum = this.totalPages();
    }
    inputValue.value = pageNum.toString();
    this.currentPage.set(pageNum);
  }

  getPaginationArray(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }
}

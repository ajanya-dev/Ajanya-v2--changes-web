import {
  Component,
  DestroyRef,
  HostBinding,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { V4PaymentsTableComponent } from '../v4-payments-table/v4-payments-table.component';
import { V4CheckListComponent } from '../v4-check-list/v4-check-list.component';

@Component({
  selector: 'app-detailed-tab',
  standalone: true,
  imports: [
    V4PaymentsTableComponent,
    CommonTabV4Component,
    CommonButtonV4Component,
    WhiteLabelDirective,
    MatTooltip
  ],
  templateUrl: './detailed-tab.component.html',
  styles: [
    `
      /* Import payments / Check reconciliation buttons: design font (peridot), 11.5px.
         Scoped to this strip so it cannot reach buttons rendered inside the table. */
      :host ::ng-deep .import-actions app-common-button-v4 button {
        font-family: var(--font-peridot) !important;
        font-size: 11.5px !important;
      }
      .export-link {
        white-space: nowrap;
        font-size: 11.5px;
        font-weight: 600;
        color: var(--v4-primary-brand-bold-color);
      }
      .export-link:hover:not(:disabled) {
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .export-links > .export-link + .export-link::before {
        content: '·';
        margin: 0 6px;
        font-weight: 400;
        color: var(--v4-subtle-text-color);
        text-decoration: none;
      }
    `
  ]
})
export class DetailedTabComponent implements OnInit {
  @HostBinding('class') class = 'flex flex-col flex-1 min-h-0';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  @ViewChild('paymentsTable')
  private paymentsTableCmp?: V4PaymentsTableComponent;

  activeFilter = signal<string>('all');
  /** Cached check-list instance for the inline check import/export strip. Set on the next
   *  tick (once the nested child has mounted) so the template reads a stable local signal
   *  instead of a grandchild ViewChild during change detection (avoids NG0100). */
  checkListRef = signal<V4CheckListComponent | undefined>(undefined);

  ngOnInit(): void {
    this.syncFilterFromUrl();

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncFilterFromUrl());
  }

  onFilterChange(value: string): void {
    this.router.navigate(['..', value], { relativeTo: this.route });
  }

  private syncFilterFromUrl(): void {
    const filterParam = this.route.snapshot.params.filter;
    if (filterParam) {
      this.activeFilter.set(filterParam);
      this.checkListRef.set(undefined);
      if (filterParam === 'check') {
        // Defer until the check-list child has mounted, then cache its instance.
        setTimeout(() =>
          this.checkListRef.set(this.paymentsTableCmp?.checkListComp)
        );
      }
    }
  }
}

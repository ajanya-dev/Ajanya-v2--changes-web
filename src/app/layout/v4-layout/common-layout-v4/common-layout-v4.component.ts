import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostBinding,
  OnDestroy,
  OnInit,
  Type,
  inject,
  input
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';

@Component({
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltipModule],
  selector: 'app-common-layout-v4',
  templateUrl: './common-layout-v4.component.html',
  styleUrls: ['./common-layout-v4.component.scss']
})
export class CommonLayoutV4Component implements OnInit, OnDestroy {
  // Fill the page host (which fills the v4 page scroller) instead of a vh calc.
  // min-h-0 stops the grid's content height from stretching the layout; the
  // short-screen floor (min-h-[720px]) lives on the routed page host so the
  // page scroller keeps its bottom padding when it scrolls.
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-0';

  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  headerComponent = input<Type<unknown>>();
  listComponent = input<Type<unknown>>();
  detailsComponent = input.required<Type<unknown>>();
  transactionsComponent = input<Type<unknown>>();
  listviewComponent = input<Type<unknown>>();

  headerInputs = input<Record<string, unknown>>({});
  listInputs = input<Record<string, unknown>>({});
  detailsInputs = input<Record<string, unknown>>({});
  transactionsInputs = input<Record<string, unknown>>({});
  listviewInputs = input<Record<string, unknown>>({});

  showToggle = input<boolean>(false);
  showCollapseIcon = input<boolean>(true);
  isLoading = input<boolean>(false);
  backButtonText = input<string>('Back');
  detailsPanelEmpty = input<boolean>(false);
  transactionsPanelEmpty = input<boolean>(false);
  /** Tighter gap between the details card and the transactions table (opt-in per page). */
  compactSpacing = input<boolean>(false);

  isNarrow = false;

  isGridView = this.commonLayoutToggleV4Service.gridView;
  isSmallScreen = this.commonLayoutToggleV4Service.isSmallScreen;
  showMobileDetail = this.commonLayoutToggleV4Service.showMobileDetail;
  hideListPanel = this.commonLayoutToggleV4Service.hideListPanel;

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 1024px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.commonLayoutToggleV4Service.isSmallScreen.set(result.matches);
        if (!result.matches) {
          this.commonLayoutToggleV4Service.showMobileDetail.set(false);
        }
      });
  }

  toggle(): void {
    this.isNarrow = !this.isNarrow;
    this.commonLayoutToggleV4Service.toggle.set(this.isNarrow);
  }

  goBackToList(): void {
    this.commonLayoutToggleV4Service.navigateToList();
  }

  ngOnDestroy(): void {
    this.commonLayoutToggleV4Service.toggle.set(false);
    this.commonLayoutToggleV4Service.gridView.set(true);
    this.commonLayoutToggleV4Service.showMobileDetail.set(false);
    this.commonLayoutToggleV4Service.hideListPanel.set(false);
  }
}

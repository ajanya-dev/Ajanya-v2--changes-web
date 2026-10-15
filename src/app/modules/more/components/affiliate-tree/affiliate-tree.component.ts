import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, NgClass, TitleCasePipe } from '@angular/common';
import { faUsers, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { IAffiliateNode } from '../../model/affiliate';

@Component({
  selector: 'app-affiliate-tree',
  standalone: true,
  imports: [CommonModule, FaIconComponent, TitleCasePipe, NgClass],
  templateUrl: './affiliate-tree.component.html',
  styleUrls: ['./affiliate-tree.component.scss']
})
export class AffiliateTreeComponent implements OnInit, OnDestroy {
  private affiliateService = inject(AffiliateProgramsService);

  faChevronRight = faChevronRight;
  faUsers = faUsers;

  navigationPath: IAffiliateNode[] = [];
  currentLevel: IAffiliateNode | null = null;
  destroy$ = new Subject();
  isLoading = signal(false);
  affiliates: IAffiliateNode[] = [];

  ngOnInit() {
    this.getAffiliateTree();
  }

  getAffiliateTree() {
    this.isLoading.set(true);
    this.affiliateService
      .affiliateTree()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.affiliates = res?.data;
          this.currentLevel = this.affiliates[0];
          this.navigationPath = [this.currentLevel];
        }
      });
  }

  navigateToAffiliate(affiliate: IAffiliateNode) {
    this.currentLevel = affiliate;

    // Find the path to this affiliate
    const findPath = (
      test: IAffiliateNode,
      current: IAffiliateNode[],
      target: number
    ): IAffiliateNode[] | null => {
      if (current[current.length - 1].affiliate_user_id === target) {
        return current;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const child of current[current.length - 1].children) {
        const path = findPath(child, [...current, child], target);
        if (path) return path;
      }

      return null;
    };

    const newPath = findPath(
      this.affiliates[0],
      [this.affiliates[0]],
      affiliate.affiliate_user_id
    );
    if (newPath) {
      this.navigationPath = newPath;
    }
  }

  navigateToLevel(affiliate: IAffiliateNode) {
    const index = this.navigationPath.findIndex(
      (path) => path.affiliate_user_id === affiliate.affiliate_user_id
    );
    if (index !== -1) {
      this.navigationPath = this.navigationPath.slice(0, index + 1);
      this.currentLevel = affiliate;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

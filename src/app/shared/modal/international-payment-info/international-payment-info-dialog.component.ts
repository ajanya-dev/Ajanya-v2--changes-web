import { Component, inject, AfterViewInit, ElementRef, OnDestroy, output, input } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faGlobe } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { LocalStorageService } from '../../service/storage/local-storage.service';

@Component({
  selector: 'app-international-payment-info-dialog',
  templateUrl: './international-payment-info-dialog.component.html',
  styleUrls: ['./international-payment-info-dialog.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    CommonButtonV35Component
  ]
})
export class InternationalPaymentInfoDialogComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private elementRef = inject(ElementRef);

  closeInfo = output<void>();
  targetMenuSelector = input<string>();
  
  faXmark = faXmark;
  faGlobe = faGlobe;

  ngAfterViewInit() {
    // Position the popup relative to the International Payment menu item
    if (this.targetMenuSelector()) {
      this.positionPopup();
    }
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  private positionPopup() {
    const menuItem = document.querySelector(this.targetMenuSelector() || '[data-menu-id="international-payment"]');
    if (menuItem) {
      const rect = menuItem.getBoundingClientRect();
      const popup = this.elementRef.nativeElement.querySelector('.international-payment-popup');
      
      if (popup) {
        // Check if sidebar is collapsed or expanded
        const isCollapsed = menuItem.closest('.collapsed-sidebar');
        
        if (isCollapsed) {
          // Position to the right of collapsed menu
          popup.style.position = 'fixed';
          popup.style.left = `${rect.right + 10}px`;
          popup.style.top = `${rect.top}px`;
        } else {
          // Position below expanded menu
          popup.style.position = 'fixed';
          popup.style.left = `${rect.left + 120}px`;
          popup.style.top = `${rect.bottom + 8}px`;
        }
      }
    }
  }

  onStartSending() {
    document.body.style.overflow = '';
    this.closeInfo.emit();
    this.router.navigateByUrl('/manage/international-payment/index');
    this.markAsSeen();
  }

  onDismiss() {
    document.body.style.overflow = '';
    this.closeInfo.emit();
    this.markAsSeen();
  }

  private markAsSeen() {
    this.localStorageService.setItem('hasSeenInternationalPaymentInfo', true);
  }

  ngOnDestroy() {
    // Restore body scroll when component is destroyed
    document.body.style.overflow = '';
  }
}
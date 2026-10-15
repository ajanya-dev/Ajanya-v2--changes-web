import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * @description V4 Modal component for previewing ACH authorization data.
 */
@Component({
  selector: 'app-ach-preview-modal-v4',
  templateUrl: './ach-preview-modal-v4.component.html',
  styleUrls: ['./ach-preview-modal-v4.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, MatDialogClose]
})
export class AchPreviewModalV4Component implements OnInit {
  private sanitizer = inject(DomSanitizer);
  public data = inject(MAT_DIALOG_DATA) as string;

  readonly XIcon = X;

  urlSafe: SafeResourceUrl | null = null;

  ngOnInit(): void {
    if (this.isValidUrl(this.data)) {
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.data);
    }
  }

  /**
   * Validates whether a given string is a valid HTTP or HTTPS URL. Used to prevent security issues.
   * @param {string} url - The string to be validated as a URL.
   * @returns {boolean} - Returns `true` if the URL is valid and uses either the 'http' or 'https' protocol.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }
}

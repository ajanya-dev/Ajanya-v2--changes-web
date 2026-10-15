import { faSpinnerThird } from '@fortawesome/pro-regular-svg-icons';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPinterestP,
  faInstagram,
  faTelegramPlane,
  faYoutube,
  faSnapchatGhost,
  faTiktok,
  faRedditAlien,
  faWeixin
} from '@fortawesome/free-brands-svg-icons';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { LucideAngularModule, X, Copy } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { socialMediaConfigs, SocialMediaConfig } from './share-url-builder.util';
import { LocalStorageService } from '../../service/storage/local-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatDialogClose,
    MatDialogModule,
    LucideAngularModule,
    MatTooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-social-share-modal',
  templateUrl: './social-share-modal.component.html',
  styleUrls: ['./social-share-modal.component.scss']
})
export class SocialShareModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<SocialShareModalComponent>);
  private clipBoard = inject(Clipboard);
  private alertService = inject(V4AlertService);
  private cdr = inject(ChangeDetectorRef);
  private localStorageService = inject(LocalStorageService);
  private env = environment;

  public data: {
    url: string;
    title?: string;
    description?: string;
  } = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  isCopyLoading = signal(false);
  socialPlatforms: Array<{
    key: string;
    config: SocialMediaConfig;
  }> = [];

  readonly XIcon = X;
  readonly CopyIcon = Copy;
  faSpinner = faSpinnerThird;

  readonly brandIcons: Record<string, any> = {
    pinterest: faPinterestP,
    instagram: faInstagram,
    telegram: faTelegramPlane,
    youtube: faYoutube,
    snapchat: faSnapchatGhost,
    tiktok: faTiktok,
    reddit: faRedditAlien,
    weChat: faWeixin
  };

  ngOnInit(): void {
    this.setSocialPlatforms();
    this.configureDialogBehavior();
  }

  /**
   * Configure dialog behavior to prevent accidental closing during operations
   */
  configureDialogBehavior(): void {
    this.dialogRef.disableClose = true;
    this.subscriptions.push(
      this.dialogRef.backdropClick().subscribe(() => {
        if (this.isCopyLoading()) {
          this.alertService.failedAlert({
            content: 'Please wait for the current operation to complete.',
            close: true,
            timeout: 1500
          });
        } else {
          this.close();
        }
      })
    );

    // Handle escape key press
    this.subscriptions.push(
      this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (this.isCopyLoading()) {
            this.alertService.failedAlert({
              content: 'Please wait for the current operation to complete.',
              close: true,
              timeout: 1500
            });
          } else {
            this.close();
          }
        }
      })
    );
  }

  setSocialPlatforms() {
    this.socialPlatforms = Object.entries(socialMediaConfigs).map(
      ([key, config]) => ({ key, config })
    );
  }

  /**
   * Handle social media sharing
   */
  onShare(platform: string) {
    const platformData = this.socialPlatforms.find((p) => p.key === platform);
    if (!platformData) return;

    if (platform === 'copy') {
      this.copyLink();
      return;
    }

    const productName = this.env.productName;
    const payorName = this.localStorageService.getItem('activeCompanyName');

    const message = `Hi! ${payorName} is ready to send your payment via ${productName}. Please use this secure link to quickly add your payment details. The link will expire in 24 hours.`;
    let shareUrl: string;
    
    // Handle different platforms with custom message
    if (platform === 'whatsapp') {
      shareUrl = platformData.config.url.replace('{url}', encodeURIComponent(`${message} ${this.data.url}`));
    } else if (platform === 'facebook') {
      shareUrl = platformData.config.url.replace('{url}', encodeURIComponent(this.data.url));
      shareUrl += `&quote=${encodeURIComponent(message)}`;
    } else if (platform === 'x') {
      shareUrl = platformData.config.url.replace('{url}', encodeURIComponent(this.data.url));
      shareUrl += `&text=${encodeURIComponent(message)}`;
    } else if (platform === 'linkedin') {
      shareUrl = platformData.config.url.replace('{url}', encodeURIComponent(this.data.url));
      shareUrl += `&summary=${encodeURIComponent(message)}`;
    } else if (platform === 'telegram') {
      shareUrl = platformData.config.url.replace('{url}', encodeURIComponent(`${message} ${this.data.url}`));
    } else {
      shareUrl = platformData.config.url.replace('{url}', encodeURIComponent(this.data.url));
    }

    window.open(shareUrl, '_blank');
  }

  /**
   * Copy link to clipboard
   */
  copyLink() {
    if (!this.data.url) return;

    this.isCopyLoading.set(true);

    setTimeout(() => {
      const textToCopy = this.data.description 
        ? `${this.data.description} ${this.data.url}`
        : this.data.url;
      
      this.clipBoard.copy(textToCopy);
      this.alertService.successAlert({
        content: 'Link copied successfully',
        close: true,
        timeout: 1500
      });
      this.isCopyLoading.set(false);
      this.cdr.detectChanges();
    }, 500);
  }

  /**
   * handles modal close action
   */
  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.isCopyLoading.set(false);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

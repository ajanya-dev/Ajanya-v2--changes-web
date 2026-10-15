import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { setup } from '@loomhq/record-sdk';
import { isSupported } from '@loomhq/record-sdk/is-supported';
import { FeatureRequestModalComponent } from 'src/app/shared/modal/feature-request-modal/feature-request-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoomService {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);

  buttonId: string = '';
  publicAppId = environment.loomPublicId;

  loomVideos: string[] = [];
  isVideoLoading: boolean = false;
  formData: {
    attachment: string | undefined;
    description: string[] | undefined;
  };

  async takeLoom(reopenConfig?: { component: any; config: any; data?: any }) {
    this.isVideoLoading = true;
    const { supported, error } = await isSupported();

    if (!supported) {
      this.alertService.warningAlert({ content: error });
      this.isVideoLoading = false;
      return;
    }

    const button = document.getElementById(this.buttonId);

    if (!button) {
      return;
    }

    const { configureButton } = await setup({
      publicAppId: this.publicAppId
    });

    const sdkButton = configureButton({ element: button });
    const buttonElement = document.getElementById(this.buttonId);
    if (buttonElement) {
      buttonElement.click();
    }
    this.isVideoLoading = false;
    sdkButton.on('insert-click', async (video) => {
      this.loomVideos.push(video.sharedUrl);
    });

    sdkButton.on('lifecycle-update', (event: string) => {
      if (event) {
        this.dialog.closeAll();
        if (reopenConfig) {
          this.dialog.open(reopenConfig.component, {
            ...reopenConfig.config,
            data: reopenConfig.data ?? { formData: this.formData }
          });
        } else {
          this.dialog.open(FeatureRequestModalComponent, {
            maxWidth: '100%',
            data: { formData: this.formData }
          });
        }
      }
    });
  }

  removeVideo(video: string) {
    this.loomVideos = this.loomVideos.filter((data) => {
      return data !== video;
    });
  }
}

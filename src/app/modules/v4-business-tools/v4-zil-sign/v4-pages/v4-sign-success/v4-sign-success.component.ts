import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ZilSignService } from 'src/app/modules/business-tools/zil-sign/service/zil-sign.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { environment } from 'src/environments/environment';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';

@Component({
  selector: 'app-v4-sign-success',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component],
  templateUrl: './v4-sign-success.component.html',
  styleUrls: ['./v4-sign-success.component.scss']
})
export class V4SignSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zilSignService = inject(ZilSignService);
  private alert = inject(V4AlertService);
  private authV3Service = inject(AuthV3Service);

  token = '';
  documentId = '';
  documentName = '';
  logoPath = 'assets/main/zil_Money_logo.svg';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    this.documentId = this.route.snapshot.queryParams['documentId'] || '';

    if (!this.token || !this.documentId) {
      this.router.navigate(['/']);
      return;
    }

    if (environment.isItWhiteLabel) {
      this.logoPath = `assets/white_label/${environment.env_id}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ||
        'assets/main/zil_Money_logo.svg';
    }
  }

  emailToMe(): void {
    if (!this.documentId || !this.token) return;
    this.zilSignService
      .emailDocumentToSignee(this.token)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alert.successAlert({
              content: res.data || 'Document emailed successfully',
              title: 'Success'
            });
          } else {
            this.alert.failedAlert({
              content: 'Failed to email document',
              title: 'Error'
            });
          }
        },
        error: (err) => {
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to email document',
            title: 'Error'
          });
        }
      });
  }

  print(): void {
    if (!this.documentId || !this.token) return;
    this.zilSignService
      .getDownloadUrlOutside(this.token)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.downloadUrl) {
            const printWindow = window.open(response.data.downloadUrl, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                setTimeout(() => printWindow.print(), 250);
              };
            } else {
              const link = document.createElement('a');
              link.href = response.data.downloadUrl;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } else {
            this.alert.failedAlert({
              content: 'Failed to get download URL',
              title: 'Error'
            });
          }
        },
        error: (err) => {
          this.alert.failedAlert({
            content:
              err?.error?.message || 'Failed to load document for printing',
            title: 'Error'
          });
        }
      });
  }

  download(): void {
    if (!this.documentId || !this.token) return;
    this.zilSignService
      .getDownloadUrlOutside(this.token)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.downloadUrl) {
            const link = document.createElement('a');
            link.href = response.data.downloadUrl;
            link.download = `${this.documentName || 'document'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            this.alert.failedAlert({
              content: 'Failed to get download URL',
              title: 'Error'
            });
          }
        },
        error: (err) => {
          this.alert.failedAlert({
            content: err?.error?.message || 'Failed to download document',
            title: 'Error'
          });
        }
      });
  }
}

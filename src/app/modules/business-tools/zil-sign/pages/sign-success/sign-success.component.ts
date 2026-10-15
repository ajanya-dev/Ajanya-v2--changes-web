import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faPrint,
  faDownload
} from '@fortawesome/pro-solid-svg-icons';
import { ZilSignService } from '../../service/zil-sign.service';
import { take } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IApiRes } from 'src/app/models/api';
import { NgOptimizedImage } from '@angular/common';
import { environment } from 'src/environments/environment';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';

@Component({
  selector: 'app-sign-success',
  standalone: true,
  imports: [FaIconComponent, NgOptimizedImage],
  templateUrl: './sign-success.component.html',
  styleUrl: './sign-success.component.scss'
})
export class SignSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zilSignService = inject(ZilSignService);
  private alertService = inject(AlertService);
  private authV3Service = inject(AuthV3Service);

  token: string = '';
  documentId: string = '';
  documentName: string = '';
  logoPath = 'assets/main/zil_Money_logo.svg';
  env = environment;

  faEnvelope = faEnvelope;
  faPrint = faPrint;
  faDownload = faDownload;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    this.documentId = this.route.snapshot.queryParams['documentId'] || '';
    
    if (!this.token || !this.documentId) {
      this.router.navigate(['/']);
    }

    // Set logo path based on environment
    if (this.env.isItWhiteLabel) {
      this.logoPath = `assets/white_label/${this.env.env_id}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/zil_Money_logo.svg';
    }
  }

  emailToMe(): void {
    if (!this.documentId || !this.token) return;

    this.zilSignService
      .emailDocumentToSignee(this.token)
      .pipe(take(1))
      .subscribe({
        next: (res: IApiRes<string>) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.data || 'Document emailed successfully',
              title: 'Success'
            });
          } else {
            this.alertService.failedAlert({
              content: 'Failed to email document',
              title: 'Error'
            });
          }
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to email document',
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
                setTimeout(() => {
                  printWindow.print();
                }, 250);
              };
            } else {
              // Fallback: if popup blocked, create a link and open in new tab
              const link = document.createElement('a');
              link.href = response.data.downloadUrl;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } else {
            this.alertService.failedAlert({
              content: 'Failed to get download URL',
              title: 'Error'
            });
          }
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to load document for printing',
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
            this.alertService.failedAlert({
              content: 'Failed to get download URL',
              title: 'Error'
            });
          }
        },
        error: (error) => {
          this.alertService.failedAlert({
            content: error?.error?.message || 'Failed to download document',
            title: 'Error'
          });
        }
      });
  }
}


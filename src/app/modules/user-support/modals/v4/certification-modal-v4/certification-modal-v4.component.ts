import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, Shield, Lock } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-certification-modal-v4',
  templateUrl: './certification-modal-v4.component.html',
  styleUrls: ['./certification-modal-v4.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    LucideAngularModule,
    CommonButtonV4Component,
    MatDialogClose
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CertificationModalV4Component {
  private dialogRef = inject(MatDialogRef<CertificationModalV4Component>);
  private localStorageService = inject(LocalStorageService);

  // Lucide icons
  readonly ShieldIcon = Shield;
  readonly LockIcon = Lock;

  // FontAwesome icon for X button
  readonly faXmark = faXmark;

  readonly certifications: { name: string; image: string; alt: string }[] = [
    {
      name: 'SOC 1',
      image: '/assets/images/certifications/SOC1.png',
      alt: 'SOC 1 Certification'
    },
    {
      name: 'SOC 2',
      image: '/assets/images/certifications/SOC2.png',
      alt: 'SOC 2 Certification'
    },
    {
      name: 'HIPAA',
      image: '/assets/images/certifications/HIPPA.png',
      alt: 'HIPAA Certification'
    },
    {
      name: 'GDPR',
      image: '/assets/images/certifications/GDPR.png',
      alt: 'GDPR Certification'
    },
    {
      name: 'PCI DSS',
      image: '/assets/images/certifications/PCIDSS.png',
      alt: 'PCI DSS Certification'
    },
    {
      name: 'ISO/IEC 27001',
      image: '/assets/images/certifications/ISO27001.png',
      alt: 'ISO/IEC 27001 Certification'
    },
    {
      name: 'ISO 9001',
      image: '/assets/images/certifications/ISO9001.png',
      alt: 'ISO 9001 Certification'
    },
    {
      name: 'ISO 20000',
      image: '/assets/images/certifications/ISO2200.png',
      alt: 'ISO 20000 Certification'
    },
    {
      name: 'CCPA',
      image: '/assets/images/certifications/CCPA.png',
      alt: 'CCPA Certification'
    },
    {
      name: 'NIST 800-53a',
      image: '/assets/images/certifications/53A.png',
      alt: 'NIST 800-53a Certification'
    }
  ];

  closeModal(): void {
    this.localStorageService.removeItem('showComplianceModal');
    this.dialogRef.close(true);
  }
}

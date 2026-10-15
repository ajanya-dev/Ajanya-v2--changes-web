import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { V4ComplianceDetailsModalComponent } from 'src/app/modules/user-v4/modals/v4-compliance-details-modal/v4-compliance-details-modal.component';

@Component({
  selector: 'app-v4-our-compliances',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    V4ComplianceDetailsModalComponent
  ],
  templateUrl: './v4-our-compliances.component.html',
  styleUrls: ['./v4-our-compliances.component.scss']
})
export class V4OurCompliancesComponent {
  private dialog = inject(MatDialog);

  readonly ShieldCheckIcon = ShieldCheck;

  certificates = [
    {
      id: 'soc1',
      image: 'assets/images/certifications/SOC1.png',
      name: 'SOC 1',
      description: 'Financial Controls',
      status: 'Active'
    },
    {
      id: 'soc2',
      image: 'assets/images/certifications/SOC2.png',
      name: 'SOC 2',
      description: 'Data Security & Privacy Controls',
      status: 'Active'
    },
    {
      id: 'iso9001',
      image: 'assets/images/certifications/ISO9001.png',
      name: 'ISO 9001 Certification',
      description: 'Quality Management',
      status: 'Active'
    },
    {
      id: 'iso20000',
      image: 'assets/images/certifications/ISO2200.png',
      name: 'ISO 20000 Certification',
      description: 'IT Service Management',
      status: 'Active'
    },
    {
      id: 'iso/iec27001',
      image: 'assets/images/certifications/ISO27001.png',
      name: 'ISO/IEC 27001 Certification',
      description: 'Information Security Management',
      status: 'Active'
    },
    {
      id: 'pcidss',
      image: 'assets/images/certifications/PCIDSS.png',
      name: 'PCI DSS Compliance',
      description: 'Secure Credit Card Processing',
      status: 'Active'
    },
    {
      id: 'hipaa',
      image: 'assets/images/certifications/HIPPA.png',
      name: 'HIPAA Compliance',
      description: 'Healthcare Data Protection',
      status: 'Active'
    },
    {
      id: 'gdpr',
      image: 'assets/images/certifications/GDPR.png',
      name: 'GDPR Compliance',
      description: 'European Personal Data Protection',
      status: 'Active'
    },
    {
      id: 'ccpa',
      image: 'assets/images/certifications/CCPA.png',
      name: 'CCPA Compliance',
      description: 'California Consumer Privacy',
      status: 'Active'
    },
    {
      id: '53a',
      image: 'assets/images/certifications/53A.png',
      name: 'NIST 800-53 Compliance',
      description: 'Security and Privacy Controls',
      status: 'Active'
    }
  ];

  onKeyPress(event: KeyboardEvent, item: (typeof this.certificates)[0]): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.showCertificationDetailsModal(item);
      event.preventDefault();
    }
  }

  showCertificationDetailsModal(item: (typeof this.certificates)[0]): void {
    this.dialog.open(V4ComplianceDetailsModalComponent, {
      data: {
        id: item.id,
        name: item.name,
        image: item.image
      },
      width: '600px',
      panelClass: 'paddingless-modal-rounded'
    });
  }
}

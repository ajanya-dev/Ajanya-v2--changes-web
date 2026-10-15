import { Component, inject, OnInit } from '@angular/core';
import { ComplianceDetailsModalComponent } from '../../modals/compliance-details-modal/compliance-details-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-our-compliances',
  templateUrl: './our-compliances.component.html',
  styleUrls: ['./our-compliances.component.scss'],
  imports:[ComplianceDetailsModalComponent]
})
export class OurCompliancesComponent implements OnInit {
  private dialog = inject(MatDialog);
  
  certificates = [
    { id:'soc1', image: 'assets/images/certifications/SOC1.png', name: 'SOC 1', description: 'Financial Controls', status: 'Active' },
    { id:'soc2', image: 'assets/images/certifications/SOC2.png', name: 'SOC 2', description: 'Data Security & Privacy Controls', status: 'Active' },
    { id:'iso9001', image: 'assets/images/certifications/ISO9001.png', name: 'ISO 9001 Certification', description: 'Quality Management', status: 'Active' },
    { id:'iso20000', image: 'assets/images/certifications/ISO2200.png', name: 'ISO 20000 Certification', description: 'IT Service Management', status: 'Active' },
    { id:'iso/iec27001', image: 'assets/images/certifications/ISO27001.png', name: 'ISO/IEC 27001 Certification', description: 'Information Security Management', status: 'Active' },
    { id:'pcidss', image: 'assets/images/certifications/PCIDSS.png', name: 'PCI DSS Compliance', description: 'Secure Credit Card Processing', status: 'Active' },
    { id:'hipaa', image: 'assets/images/certifications/HIPPA.png', name: 'HIPAA Compliance', description: 'Healthcare Data Protection', status: 'Active' },
    { id:'gdpr', image: 'assets/images/certifications/GDPR.png', name: 'GDPR Compliance', description: 'European Personal Data Protection', status: 'Active' },
    { id:'ccpa', image: 'assets/images/certifications/CCPA.png', name: 'CCPA Compliance', description: 'California Consumer Privacy', status: 'Active' },
    { id:'53a', image: 'assets/images/certifications/53A.png', name: 'NIST 800-53 Compliance', description: 'NIST 800-53 Compliance', status: 'Active' },
  ];

  constructor() { }

  ngOnInit() {
  }

  onKeyPress(event: KeyboardEvent, item: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      this.showCertificationDetailsModal(item);
      event.preventDefault();
    }
  }

  showCertificationDetailsModal(item: any) {
    this.dialog.open(ComplianceDetailsModalComponent, {
      data: {
        id: item.id,
        name: item.name,
        image: item.image,
      },
      width: '600px',
      panelClass: 'p-0'
    });
  }

}

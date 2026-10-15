import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';

interface IComplianceDetail {
  id: string;
  name: string;
  detailed_description: string;
  applicable_to: string;
}

@Component({
  selector: 'app-v4-compliance-details-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './v4-compliance-details-modal.component.html'
})
export class V4ComplianceDetailsModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4ComplianceDetailsModalComponent>);
  private data: { id: string; name: string; image: string } =
    inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  certificateImage = '';
  certificateName = '';
  certificateDescription = '';
  certificateApplicableTo = '';

  details: IComplianceDetail[] = [
    {
      id: 'soc1',
      name: 'SOC 1',
      detailed_description:
        'SOC 1 provides assurance that our financial processes are reliable and secure. This certification confirms that Zil Money maintains effective controls over financial reporting, ensuring the integrity of your financial transactions.',
      applicable_to: 'All Zil Money financial transaction processing services.'
    },
    {
      id: 'soc2',
      name: 'SOC 2',
      detailed_description:
        'SOC 2 ensures customer data is protected across five key areas: security, availability, processing integrity, confidentiality, and privacy. It demonstrates our commitment to safeguarding your information and maintaining a secure, trustworthy platform.',
      applicable_to: 'All Zil Money services and platforms.'
    },
    {
      id: 'iso9001',
      name: 'ISO 9001 Certification',
      detailed_description:
        "ISO 9001 Certification demonstrates Zil Money's dedication to quality management and continuous improvement. This ensures that our services consistently meet customer expectations and regulatory requirements.",
      applicable_to: 'All Zil Money products and services.'
    },
    {
      id: 'iso20000',
      name: 'ISO 20000 Certification',
      detailed_description:
        "ISO 20000 Certification ensures that Zil Money's IT service management and delivery are consistent, reliable, and aligned with international best practices. This helps us provide high-quality IT services that support your business needs.",
      applicable_to: 'Zil Money IT service management and delivery operations.'
    },
    {
      id: 'iso/iec27001',
      name: 'ISO/IEC 27001 Certification',
      detailed_description:
        'ISO/IEC 27001 Certification indicates that Zil Money has implemented a comprehensive information security management system (ISMS). This globally recognized standard reflects our ongoing commitment to protecting your data assets with robust security controls.',
      applicable_to: 'All Zil Money cloud services and on-premise products.'
    },
    {
      id: 'pcidss',
      name: 'PCI DSS Compliance',
      detailed_description:
        'PCI DSS Compliance ensures secure processing of credit card information. Zil Money follows rigorous security standards to protect your payment data and prevent fraud throughout every transaction.',
      applicable_to:
        'All Zil Money payment processing and card transaction services.'
    },
    {
      id: 'hipaa',
      name: 'HIPAA Compliance',
      detailed_description:
        'HIPAA Compliance protects sensitive health information for healthcare clients. Zil Money adheres to strict U.S. healthcare privacy regulations to ensure that medical data remains confidential and secure.',
      applicable_to:
        'Zil Money services for healthcare organizations and clients handling health information.'
    },
    {
      id: 'gdpr',
      name: 'GDPR Compliance',
      detailed_description:
        'GDPR Compliance aligns Zil Money with European data protection standards for handling personal data. This certification guarantees that your privacy rights are respected and your personal information is processed lawfully and transparently.',
      applicable_to: 'All Zil Money services processing data of EU residents.'
    },
    {
      id: 'ccpa',
      name: 'CCPA Compliance',
      detailed_description:
        "CCPA Compliance demonstrates Zil Money's adherence to California's consumer privacy laws. We empower users with greater control over their personal information and ensure transparent handling of data.",
      applicable_to: 'All Zil Money services for California residents.'
    },
    {
      // Must match the id used in v4-our-compliances.component.ts (`'53a'`).
      // Without this entry, find() returned undefined and the modal
      // rendered an empty heading and empty body sections.
      id: '53a',
      name: 'NIST 800-53 Compliance',
      detailed_description:
        'NIST 800-53 Compliance aligns Zil Money with the security and privacy controls defined by the U.S. National Institute of Standards and Technology for federal information systems. It demonstrates that our platform follows a comprehensive, risk-based framework covering access control, audit, incident response, and system integrity to safeguard customer data.',
      applicable_to:
        'All Zil Money services and infrastructure handling sensitive customer or organizational data.'
    }
  ];

  ngOnInit(): void {
    this.getDetails();
  }

  getDetails(): void {
    const details = this.details.find((item) => item.id === this.data.id);
    this.certificateApplicableTo = details?.applicable_to || '';
    this.certificateDescription = details?.detailed_description || '';
    this.certificateImage = this.data.image || '';
    this.certificateName = details?.name || '';
  }

  close(): void {
    this.dialogRef.close();
  }
}

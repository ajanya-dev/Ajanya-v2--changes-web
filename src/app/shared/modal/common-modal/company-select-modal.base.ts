import { Directive, OnInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IConnectedCompanyList } from 'src/app/modules/integration/model/integration';

export type TCompanySelectItem = Partial<IConnectedCompanyList> & {
  realmId?: string;
  data?: unknown[];
  pagination?: { total?: number };
};

export type TAvatarTone = { bg: string; text: string };

@Directive()
export abstract class CompanySelectModalBase implements OnInit {
  private dialogRef = inject(MatDialogRef<unknown>);

  public data: { mode: string; companyList: TCompanySelectItem[] } =
    inject(MAT_DIALOG_DATA);

  abstract readonly avatarTones: TAvatarTone[];

  companies: TCompanySelectItem[] = [];

  filteredCompanies: TCompanySelectItem[] = [];

  companySelected: TCompanySelectItem | undefined;

  searchTerm = '';

  private avatarTonesByCompany = new Map<TCompanySelectItem, TAvatarTone>();

  ngOnInit(): void {
    this.companies = [...(this.data.companyList ?? [])];
    this.filteredCompanies = this.companies;
    this.companies.forEach((company, index) => {
      this.avatarTonesByCompany.set(
        company,
        this.avatarTones[index % this.avatarTones.length]
      );
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    const needle = term.trim().toLowerCase();
    this.filteredCompanies = needle
      ? this.companies.filter((company) =>
          (company.companyName ?? '').toLowerCase().includes(needle)
        )
      : this.companies;
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  selectCompany(company: TCompanySelectItem): void {
    this.companySelected = this.isSelected(company) ? undefined : company;
  }

  isSelected(company: TCompanySelectItem): boolean {
    return this.companySelected === company;
  }

  getInitials(company: TCompanySelectItem): string {
    const words = (company.companyName ?? '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      return '?';
    }
    const letters =
      words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
    return letters.toUpperCase();
  }

  getAvatarTone(company: TCompanySelectItem): TAvatarTone {
    return this.avatarTonesByCompany.get(company) ?? this.avatarTones[0];
  }

  getCompanyMeta(company: TCompanySelectItem): string {
    const parts: string[] = [];
    const bankCount = company.pagination?.total ?? company.data?.length;
    if (typeof bankCount === 'number') {
      parts.push(`${bankCount} bank account${bankCount === 1 ? '' : 's'}`);
    }
    if (company.status) {
      parts.push(company.status);
    }
    return parts.join(' · ');
  }

  onImportClicked(): void {
    if (!this.companySelected) {
      return;
    }
    this.dialogRef.close(this.companySelected);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

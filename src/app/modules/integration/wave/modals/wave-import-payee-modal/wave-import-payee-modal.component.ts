import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { IWaveImportedCompany } from 'src/app/modules/integration/model/integration';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';

@Component({
  selector: 'app-wave-import-payee-modal',
  templateUrl: './wave-import-payee-modal.component.html',
  styleUrls: ['./wave-import-payee-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, FormsModule,WhiteLabelPipe]
})
export class WaveImportPayeeModalComponent implements OnInit {
  /**
   * List of Wave imported companies
   */
  companies: IWaveImportedCompany[] = [];

  /**
   * Selected Wave imported company
   */
  companySelected: IWaveImportedCompany;

  constructor(
    /**
     * Injects data into the modal component.
     * @param waveCompanyData Data containing the mode and company list.
     * @param _dialogRef Reference to the MatDialog for this component.
     */
    @Inject(MAT_DIALOG_DATA)
    public waveCompanyData: {
      mode: string;
      companyList: IWaveImportedCompany[];
    },
    public _dialogRef: MatDialogRef<WaveImportPayeeModalComponent>
  ) {}

  ngOnInit(): void {
    // Initialize the companies list with the provided company list
    this.companies = [...this.waveCompanyData.companyList];

    // Set the selected company to the first company in the list by default
    this.companySelected = this.companies[0];
  }

  /**
   * Handles the import button click event and closes the modal with the selected company.
   */
  onImportClicked() {
    this._dialogRef.close(this.companySelected);
  }
}

import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DropDownPayeeMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-multi-select/drop-down-payee-multi-select.component';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IInvoiceDropdown, IInvoiceRule, IInvoiceRuleRow } from '../../model/invoice';

@Component({
  selector: 'app-invoice-rules-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    MatDialogClose,
    DropDownPayeeMultiSelectComponent,
    CommonInputFieldComponent,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    V35ControlMessageComponent
  ],
  templateUrl: './invoice-rules-modal.component.html',
  styleUrl: './invoice-rules-modal.component.scss',
})
export class InvoiceRulesModalComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef);
  public injectData = inject<IInvoiceRuleRow>(MAT_DIALOG_DATA);

  invoiceitemList = signal<IInvoiceDropdown[]>([]);
  page = 1;
  isSubmit = signal(false);
  isLoading = signal(false);
  editedPayeeIds:string[] = [];
  SEARCH_DEBOUNCE = 300;
  destroy$ = new Subject();
  faXmark = faXmark;

  payeeList = [
    {id:'1ZoVelwVJEG8pwb',name:'AMAL'},
    {id:'5NrWjyBJ2N42n3l',name:'No RTP'},
    {id:'RJ6qGAK8X1jE1rD',name:'Penny Carr'},
  ];

  rulesForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    payeeIds: new FormControl<string[] | null>(null, [Validators.required]),
    itemIds: new FormControl<string[] | null>(null, [Validators.required]),
    unitPrice: new FormControl<number|null>(null, [Validators.required])
  });

  ngOnInit(): void {
    this.loadCategories();
    if (this.injectData) {
      this.setValue();
    }
  }

  setValue() {
    this.rulesForm.patchValue({
      name: this.injectData?.name,
      description: this.injectData?.description,
      unitPrice: this.injectData?.unit_price,
      payeeIds: [...new Set(this.injectData?.rule_details?.map((item) => item.payee_id) || [])]
    });
    this.editedPayeeIds = [...new Set(this.injectData?.rule_details?.map((item) => item.payee_id) || [])];
  }

  private fetchInvoiceItems(page: number, searchTerm: string = '') {
    return this.invoiceService
      .getinvoiceitem(page, searchTerm)
      .pipe(takeUntil(this.destroy$));
  }

  // Initial load
  loadCategories() {
    this.fetchInvoiceItems(1).subscribe({
      next: (res) => {
        if (res.success) {
          this.invoiceitemList.set(res.data);
          if(this.injectData?.rule_details?.length){
            this.updateInvoiceList();
          }
        }
      }
    });
  }

  updateInvoiceList(){
    const selectedItems = [...new Set(this.injectData.rule_details.map(detail => 
      JSON.stringify({
        id: detail.item.encript_id.toString(),
        name: detail.item.item_name,
      })
    ))].map(item => JSON.parse(item)) as IInvoiceDropdown[];
  
    // Update invoiceitemList only with items that don't already exist
    this.invoiceitemList.update((prev) => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = selectedItems.filter(item => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });
  
    // Set the form control value
    this.rulesForm.controls.itemIds.setValue(selectedItems.map((item) => item.id));
  }

  // Infinite scroll handler
  onScrollToEnd() {
    this.page += 1;
    this.fetchInvoiceItems(this.page).subscribe({
      next: (res) => {
        this.invoiceitemList.update((prev) => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = res.data.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
    });
  }

  // Search handler with debounce
  search(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.page = 1; // Reset page when searching

    this.fetchInvoiceItems(this.page, searchTerm).subscribe({
      next: (res) => {
        this.invoiceitemList.set(res.data);
      }
    });
  }

  payeeSelectionEvent(payeeEvent: IPayeeDropdown[]): void {
    const payeeIds: string[] = [];
    payeeEvent.forEach((element) => {
      if (payeeIds?.indexOf(element?.id) === -1) {
        payeeIds?.push(element?.id);
      }
    });
    this.rulesForm?.controls?.payeeIds?.setValue(payeeIds);
  }

  submit() {
    this.rulesForm.markAllAsTouched();
    if (this.rulesForm.invalid) return;
    this.isSubmit.set(true);
    const api$ = this.injectData
      ? this.invoiceService.editInvoiceRules(
          this.injectData?.id,
          this.rulesForm.value as IInvoiceRule
        )
      : this.invoiceService.setInvoiceRules(
          this.rulesForm.value as IInvoiceRule
        );
    api$
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: this.injectData ? 'Invoice rule updated successfully' : res.message
          });
          this.dialogRef.close(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

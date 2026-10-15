import { ICellRendererParams } from '@ag-grid-community/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, signal, OnInit, OnDestroy, effect } from '@angular/core';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { debounceTime, Subject, takeUntil } from 'rxjs';

interface IPayeeLimit {
  limit: number;
  limit_frequency: number;
}

interface ILimitOption {
  id: number;
  name: string;
}

interface IPayeeLimitCellRendererParams extends ICellRendererParams {
  onLimitChanged?: (event: {
    rowId: string;
    limitData: IPayeeLimit;
  }) => void;
}

@Component({
  selector: 'app-payee-limit-cell-renderer',
  standalone: true,
  imports: [
    CommonInputFieldComponent,
    NgSelectModule,
    AsyncPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './payee-limit-cell-renderer.component.html'
})
export class PayeeLimitCellRendererComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  param: IPayeeLimitCellRendererParams;
  limit: IPayeeLimit;
  limitFormControl = new FormControl('', [
    Validators.min(0.00),
    Validators.max(999999999.99),
  ]);
  selectedLimit = signal<number | null>(null);
  disableInput = signal<boolean>(false);

  limitsToList: ILimitOption[] = [
    {
      id: 0,
      name: 'No Limit'
    },
    {
      id: 1,
      name: 'Day'
    },
    {
      id: 2,
      name: 'Week'
    },
    {
      id: 3,
      name: 'Month'
    },
    {
      id: 4,
      name: 'Year'
    }
  ];

  constructor() {
    effect(() => {
      const frequency = this.selectedLimit();
      if (this.param && this.param.setValue && frequency) {
        this.param.setValue({
          ...this.limit,
          limit_frequency: frequency
        });
      }
    });
  }

  ngOnInit(): void {
    this.limitFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updateGridData();
      });
  }

  agInit(params: IPayeeLimitCellRendererParams): void {
    this.param = params;
    this.limit = params.value || { limit: 0.00,limit_frequency: 0};

    this.limitFormControl.setValue(Number(this.limit.limit || 0).toFixed(2));
    this.selectedLimit.set(this.limit.limit_frequency || 0);
    if (this.limit.limit_frequency === 0) {
      this.limitFormControl.disable();
      this.disableInput.set(true);
    } else {
      this.limitFormControl.enable();
      this.disableInput.set(false);
    }
    this.limitFormControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$))
      .subscribe((value) => {
        this.updateGridData();
      });
  }

  refresh(): boolean {
    return true;
  }

  trackByLimit(index: number, limit: ILimitOption): number {
    return limit.id;
  }

  onLimitChange(event: number): void {
    if (event === 0) {
      this.limitFormControl.setValue('0.00');
      this.disableInput.set(true);
    } else {
      this.disableInput.set(false);
      this.limitFormControl.enable();
    }
    this.updateGridData();
  }

  private updateGridData(): void {
    const limitValue = this.limitFormControl.value;
    const frequencyValue = this.selectedLimit();

    let parsedLimit = 0.00;
    if (limitValue) {
      const cleanValue = String(limitValue).replace(/,/g, '');
      parsedLimit = parseFloat(cleanValue) || 0.00;
    }
    
    const formattedLimit = Number(parsedLimit.toFixed(2));

    const updatedData = {
      limit: formattedLimit,
      limit_frequency: frequencyValue || 0
    };

    if (this.param && this.param.setValue) {
      this.param.setValue(updatedData);
    }
    if (this.param && this.param.data) {
      this.param.data.payee_limit = updatedData;
    }

    if (this.param && this.param.onLimitChanged) {
      this.param.onLimitChanged({
        rowId: this.param.data.encrypted_id,
        limitData: updatedData
      });
    }
  }

  onLimitFocus(): void {
    const limitValue = this.limitFormControl.value;
    if (limitValue && limitValue !== '0.00') {
      // Remove formatting and show raw value for editing
      const cleanValue = String(limitValue).replace(/,/g, '');
      const parsedLimit = parseFloat(cleanValue) || 0;
      this.limitFormControl.setValue(parsedLimit.toString());
    } else if (limitValue === '0.00') {
      this.limitFormControl.setValue('');
    }
  }

  onLimitBlur(inputElement: HTMLInputElement): void {
    const limitValue = this.limitFormControl.value;
    
    // Handle empty or invalid values
    if (!limitValue || limitValue === '' || limitValue === '.') {
      this.limitFormControl.setValue('0.00');
      return;
    }

    // Clean and parse the value
    const cleanValue = String(limitValue).replace(/,/g, '');
    const parsedLimit = parseFloat(cleanValue) || 0.00;
    
    // Format with two decimal places
    this.limitFormControl.setValue(parsedLimit.toFixed(2));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

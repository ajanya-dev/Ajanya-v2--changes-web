import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { finalize, Subject, Subscription, takeUntil } from 'rxjs';
import { IIndustryTypes } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';

@Component({
  selector: 'app-industry-types-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltip
  ],
  templateUrl: './industry-types-dropdown.component.html',
  styleUrl: './industry-types-dropdown.component.scss',

})
export class IndustryTypesDropdownComponent implements OnInit, OnDestroy {

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;
  changesSubscription: Subscription;

  @Input() selectedItem: string | null = null;
  @Input() payeeId: string;
  @Input() enableUpdate = true;
  @Input() loading = true;

  @Input() enableAddNew = true;
  @Input() placeholder = 'Select Industry Type';
  @Input() append = 'body';
  @Input() readonly = false;
  @Output() ready = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter();
  destroy$ = new Subject();

  private payeeService = inject(PayeeService);

  searchTimeout: ReturnType<typeof setTimeout>;
  selectedIndustryType: FormControl<any | null | undefined> = new FormControl();
  searchTerm: string;
  industryTypes: IIndustryTypes[] = [];
  groupedIndustryTypes: any[] = [];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

  ngOnInit(): void {
    this.loading = true;
    this.payeeService.getIndustryTypes()
    .pipe(
      finalize(() => {this.loading = false;}),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (res) => {
        this.industryTypes = res.data;
        this.groupedIndustryTypes = this.groupIndustryTypes(this.industryTypes);
      }
    });
  }

  groupIndustryTypes(industryTypes: IIndustryTypes[]) {
    const groupedMap = new Map<string, { main: any, sub: any[] }>();
    const standalone: any[] = [];

    industryTypes.forEach(item => {
      if (item.main_category === 1) {
        if (!groupedMap.has(item.mcc_code)) {
          groupedMap.set(item.mcc_code, {
            main: item,
            sub: []
          });
        }
      }
    });

    industryTypes.forEach(item => {
      if (item.main_category === 0) {
        if (groupedMap.has(item.mcc_code)) {
          groupedMap.get(item.mcc_code)!.sub.push(item);
        } else {
          standalone.push(item);
        }
      }
    });

    return [
      ...Array.from(groupedMap.values()),
      ...standalone.map(item => ({ main: null, sub: [item] }))
    ];
  }

  getChange(event: number) {
    if(event && this.enableUpdate && this.payeeId) {
      this.payeeService.updateIndustryType(this.payeeId, {
        merchant_category: event
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: () => {
          this.selectedItem = null;
        }
      });
      
    }
    this.selectionChange.emit(event);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}

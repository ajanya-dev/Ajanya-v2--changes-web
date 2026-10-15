import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
  ViewChild,
  inject,
  input,
  effect,
  signal
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import {
  IPayeeDropdown,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { PayeeService } from '../../../service/payee/payee.service';

/**
 * @description Drop down component for payee.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule,FaIconComponent],
  selector: 'app-drop-down-payee',
  templateUrl: './drop-down-payee.component.html',
  styleUrls: ['./drop-down-payee.component.scss']
})
export class DropDownPayeeComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private alertService = inject(AlertService);

  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';

  @Input() id = 'id'; // Its better to pass a unique id always for avoiding conflict.
  @Input() isRequired = false;
  @Input() placeholder = `Select Your ${this.whiteLabelName}`;
  @Output() selectionEvent = new EventEmitter();
  @Output() clearEvent = new EventEmitter();
  @Output() newPayeeAdded = new EventEmitter();
  @Input() selectDropdownItem: IPayeeDropdown;

  selectedId = input<string|null>(null,{alias:'selectedPayeeId'});

  selectedItem: IPayeeDropdown | string | null;
  page = 1;
  searchTerm = '';
  payees: IPayeeDropdown[] = [];
  subscriptions: Subscription[] = [];
  searchTimeout: ReturnType<typeof setTimeout>;
  isLoading = signal(false);
  faSpinner = faSpinner;

  constructor(){
    effect(() => {
      if(!this.selectedId()) return;
      this.getPayeebyId(this.selectedId()as string);
    }, {allowSignalWrites: true});
  }

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isRequired) {
      this.loadRequiredLabel();
    }
    if (changes.selectDropdownItem && this.selectDropdownItem) {
      this.handleSelectedItem();
    }
  }

  ngAfterViewInit(): void {
    this.loadRequiredLabel();
  }

  ngOnInit(): void {
    this.loadPayees();
    this.checkNameChanges();

    this.subscriptions.push(
      this.sharedService.getNewPayeeCreatedData().subscribe((result) => {
        if (result === null || result === undefined || result === '') {
          this.selectedItem = null;
        }
  
        if (!result) {
          return;
        }
  
        this.subscriptions.push(
          this.payeeService.getPayees(this.page).subscribe((res) => {
            this.payees = res.data.filter(
              (payee) => payee.name && payee.name.trim() !== ''
            );
          })
        );
  
        //* **********************in edit case use this section******************** */
        if (result) {
          if (result.payeeId !== undefined) {
            // Call API only when create new account
            this.subscriptions.push(
              this.payeeService.showPayee(result.payeeId).subscribe((res) => {
                const payeeDetails: IViewPayee = res.data;
                this.selectedItem = payeeDetails.name;
              })
            );
  
            return;
          }
          this.selectedItem = result.payeeName;
        }
      })
    );
  }

  /**
   * @description THe selected drop down item is added to `this.selectDropdownItem` if not already present.
   * Also sets the same to `this.selectedItem`
   */
  handleSelectedItem() {
    setTimeout(() => {
      if (!this.payees.includes(this.selectDropdownItem)) {
        this.payees.push(this.selectDropdownItem);
      }
      this.selectedItem = this.selectDropdownItem;
    }, 100);
  }

  /**
   * @description Checks for payee name changes and updates `this.selectedItem`.
   */
  checkNameChanges(): void {
    this.subscriptions.push(
      this.payeeService.checkPayeeNameUpdate$.subscribe((res) => {
        if (res?.payeeName) {
          this.loadPayees();
        }
        if (res?.payeeNickName) {
          this.selectedItem = `${res?.payeeName}(${res?.payeeNickName})`;
        } else {
          this.selectedItem = res?.payeeName;
        }
      })
    );
  }

  /**
   * @description Load the payees list.
   */
  loadPayees() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.payeeService.getPayees(this.page)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        this.payees = res.data.filter(
          (payee) => payee.name && payee.name.trim() !== ''
        );
      })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Opens add new payee dialog if 'add-new' is selected.
   * @param event - selection event in template.
   */
  getChange(event: Event | IPayeeDropdown) {
    if ((event as IPayeeDropdown)?.name === 'Payee Name') {
      this.alertService.infoAlert({ content: 'Please select a valid payee' });
      this.ngSelectComponent.handleClearClick();
      return;
    }
    this.selectionEvent.emit(event);
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.subscriptions.push(
      this.payeeService
        .getPayees(this.page + 1, this.searchTerm)
        .subscribe((res) => {
          this.page += 1;
          res.data.forEach((element: IPayeeDropdown) => {
            this.payees.push(element);
          });
        })
    );
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = (event?.target as HTMLInputElement).value;

    const data = this.searchTerm.replace(/&/g, '%26');
    this.searchTerm = data;

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.isLoading.set(true);
      this.subscriptions.push(
        this.payeeService
          .getPayees(this.page, this.searchTerm)
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe((res) => {
            this.payees = res.data;
          })
      );
    }, 600);
  }

  /**
   * @description Clears the selection in ng select.
   */
  clearSelectedItem() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.loadPayees();
    this.clearEvent.emit();
  }

  /**
   * @description Adds or removes required label class.
   */
  loadRequiredLabel(): void {
    const dd = document.querySelectorAll(
      `#drop_down_${this.id} .ng-select-container .ng-value-container .ng-placeholder`
    );
    if (this.isRequired) dd[0]?.classList.add('drop_down_required_star');
    else dd[0]?.classList.remove('drop_down_required_star');
  }

  getPayeebyId(payeeId:string){
    this.isLoading.set(true);
    this.subscriptions.push(
      this.payeeService.getPayeesByIds([payeeId])
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if(res?.success){
          this.selectedItem = res.data[0]?.name;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sharedService.setNewPayeeCreatedData(null);

    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

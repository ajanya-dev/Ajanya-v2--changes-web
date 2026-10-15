import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  forwardRef,
  inject,
  input
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IDropdownData, IIconData } from '../../model/intro';
// import { IntroService } from '../../service/intro.service';
@Component({
  selector: 'app-intro-common-dropdown',
  templateUrl: './intro-common-dropdown.component.html',
  styleUrls: ['./intro-common-dropdown.component.scss'],
  imports: [CommonModule, NgSelectModule, FontAwesomeModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IntroCommonDropdownComponent),
      multi: true
    }
  ]
})
export class IntroCommonDropdownComponent {
  // private introService = inject(IntroService);
  private activatedRoute = inject(ActivatedRoute);

  @Output() closeDropdown = new EventEmitter();
  @Output() openDropdown = new EventEmitter();

  append = input('body');
  id = input();
  customHeight = input('1');
  labelIconNeeded = input(false);
  placeholder = input('Select');
  dropdownType = input<
    | 'payee'
    | 'bankAccount'
    | 'creditCard'
    | 'wallet'
    | 'cloudBankAccount'
    | 'payeeBank'
    | 'paymentCategory'
  >('payee');

  dropdownValue: IDropdownData;
  onChange: (value: string) => void;
  onTouched: () => void;
  disabled: boolean;

  writeValue(value: string): void {
    const { confirm } = this.activatedRoute.snapshot.queryParams;
    if (confirm) {
      this.dropdownValue = this.findItem(value as string) as IDropdownData;
    }
  }

  findItem(formValue: string) {
    return this.dummyArrayData[this.dropdownType()].find(
      (item) => item.title === formValue
    );
  }

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  dropdownSelect(item: IDropdownData) {
    if (this.onChange) {
      this.onChange(item.title); // Propagate the change to the form control
    }
  }

  ngSelectEvent(data: string) {
    if (data === 'open') {
      this.openDropdown.emit();
    } else {
      this.closeDropdown.emit();
    }
  }

  dummyArrayData: { [key: string]: Array<IDropdownData> } = {
    payee: [
      {
        title: 'Payee 1',
        subTitle: 'Vendor'
      },
      {
        title: 'Payee 2',
        subTitle: 'Customer'
      },
      {
        title: 'Payee 3',
        subTitle: 'Employee'
      }
    ],
    bankAccount: [
      {
        title: 'Bank Account 1',
        subTitle: 'xxx0015'
      },
      {
        title: 'Bank Account 2',
        subTitle: 'xxx3205'
      },
      {
        title: 'Bank Account 3',
        subTitle: 'xxx0881'
      }
    ],
    creditCard: [
      {
        title: 'Card 1',
        subTitle: '**** **** **** 1113'
      },
      {
        title: 'Card 2',
        subTitle: '**** **** **** 2355'
      },
      {
        title: 'Card 3',
        subTitle: '**** **** **** 4444'
      }
    ],
    wallet: [
      {
        title: 'Master Wallet',
        subTitle: '$1113.18'
      },
      {
        title: 'Wallet 2',
        subTitle: '$52.81'
      },
      {
        title: 'Wallet 3',
        subTitle: '$592.78'
      }
    ],
    cloudBankAccount: [
      {
        title: 'Cloud Bank Account 1',
        subTitle: '*****0012'
      },
      {
        title: 'Cloud Bank Account 2',
        subTitle: '*****3655'
      },
      {
        title: 'Cloud Bank Account 3',
        subTitle: '*****9901'
      }
    ],
    payeeBank: [
      {
        title: 'Bank Account 1',
        subTitle: '*****0012'
      },
      {
        title: 'Bank Account 2',
        subTitle: '*****3655'
      },
      {
        title: 'Bank Account 3',
        subTitle: '*****9901'
      }
    ],
    paymentCategory: [
      {
        title: 'Expense'
      },
      {
        title: 'Category 2'
      },
      {
        title: 'Category 3'
      }
    ]
  };

  icon: IIconData = {
    payee: {
      icon: ['fas', 'address-book'],
      colorVars: {
        bg: 'common-secondary-blue-color',
        text: 'common-blue-color'
      }
    },
    bankAccount: {
      icon: ['fas', 'building-columns'],
      colorVars: {
        bg: 'common-secondary-blue-color',
        text: 'common-blue-color'
      }
    },
    creditCard: {
      icon: ['fas', 'credit-card'],
      colorVars: {
        bg: 'tertiary-background-color',
        text: 'common-yellow-color'
      }
    },
    wallet: {
      icon: ['fas', 'credit-card'],
      colorVars: {
        bg: 'common-secondary-violet-color',
        text: 'common-violet-color'
      }
    },
    cloudBankAccount: {
      icon: ['fas', 'building-columns'],
      colorVars: {
        bg: 'tertiary-background-color',
        text: 'common-green-color'
      }
    },
    payeeBank: {
      icon: ['fas', 'building-columns'],
      colorVars: {
        bg: 'tertiary-background-color',
        text: 'secondary-text-color'
      }
    }
  };
}

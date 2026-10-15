/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-restricted-globals */
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';

/**
 * @description Component for calculator.
 */
@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    MatDialogClose,
    FaIconComponent,
    MatDialogActions,
    CommonButtonV35Component,
    CommonButtonV4Component
  ]
})
export class CalculatorComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<CalculatorComponent>);
  private dialogData = inject(MAT_DIALOG_DATA);

  input = '';
  result = '';
  valueExist = false;
  showAddAmountButton = false;
  outputDigitsCount: number = 11;
  calculatedValue$ = new Subject();
  subscriptions: Subscription[] = [];

  private operators: { [key: string]: (a: number, b: number) => number } = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '^': (a, b) => a ** b,
    '%': (a, b) => a % b
  };

  ngOnInit(): void {
    this.subscriptions.push(
      this.calculatedValue$.subscribe((val) => {
        if (val === '') {
          this.valueExist = false;
        } else {
          this.valueExist = true;
        }
      })
    );
    this.showAddAmountButton = !!this.dialogData.addAmountButton;
    this.outputDigitsCount = this.dialogData.outputDigitsCount || this.outputDigitsCount;
  }

  /**
   * @description Method invoked when numbers or '.' is pressed in the calculator app.
   * Does various checks and updates `this.input` string with the last pressed key.
   * Finally calculates the result so far with `this.calcAnswer()` method.
   * @summary Method called when numbers or '.' is pressed.
   * @param num - number clicked or selected.
   */
  pressNum(num: string) {
    // Do Not Allow . more than once
    if (num === '.' && this.input === '') return;

    if (num === '.') {
      if (this.input !== '') {
        const lastNum = this.getLastOperand();
        if (lastNum.lastIndexOf('.') >= 0) return;
      }
    }

    // Do Not Allow 0 at beginning.
    // Javascript will throw Octal literals are not allowed in strict mode.
    if (num === '0') {
      if (this.input === '') {
        return;
      }
      const PrevKey = this.input[this.input.length - 1];
      if (
        PrevKey === '/' ||
        PrevKey === '*' ||
        PrevKey === '-' ||
        PrevKey === '+'
      ) {
        return;
      }
    }

    // eslint-disable-next-line operator-assignment, no-multi-assign
    const input = (this.input = this.input + num);
    if (num !== '.' && this.isNum(input)) this.calculatedValue$.next(input);

    this.calcAnswer();
  }

  /**
   * @description Returns the last operand (eg. 23 + 13 + 45,  returns 45);
   * @returns Last operand.
   */
  getLastOperand() {
    let pos: number;
    pos = this.input.toString().lastIndexOf('+');
    if (this.input.toString().lastIndexOf('-') > pos)
      pos = this.input.lastIndexOf('-');
    if (this.input.toString().lastIndexOf('*') > pos)
      pos = this.input.lastIndexOf('*');
    if (this.input.toString().lastIndexOf('/') > pos)
      pos = this.input.lastIndexOf('/');
    return this.input.substr(pos + 1);
  }

  /**
   * @description Method invoked when operands (+, -, *, /) are pressed/clicked in the calculator.
   * Updates the `this.input` string with the operator.
   * @param op - operator
   */
  pressOperator(op: string) {
    const inputString =
      typeof this.input === 'string' ? this.input : String(this.input);
    if (inputString.trim() === '') return;

    // Do not allow operators more than once
    const lastKey = this.input[this.input.length - 1];

    if (
      lastKey === '/' ||
      lastKey === '*' ||
      lastKey === '-' ||
      lastKey === '+' ||
      lastKey === '.'
    ) {
      return;
    }

    this.input += op;
  }

  /**
   * @description Method to clear last input value from `this.input`.
   */
  clear() {
    if (this.input !== '') {
      this.input = this.input.substr(0, this.input.length - 1);
      this.calculatedValue$.next(this.input);
    }
  }

  /**
   * @description Method to reset the calculator by clearing all values.
   */
  allClear() {
    this.result = '';
    this.input = '';
    this.calculatedValue$.next(this.input);
  }

  /**
   * @description Method to evaluate the expression stored in `this.input` and store the result in `this.result`.
   */
  calcAnswer() {
    let formula = this.input;

    let lastKey = formula[formula.length - 1];

    if (lastKey === '.') {
      formula = formula.substr(0, formula.length - 1);
    }

    lastKey = formula[formula.length - 1];

    if (
      lastKey === '/' ||
      lastKey === '*' ||
      lastKey === '-' ||
      lastKey === '+' ||
      lastKey === '.'
    ) {
      formula = formula.substr(0, formula.length - 1);
    }
    const output = this.calculate(formula);
    this.result = String(output);
  }

  /**
   * @description Checks whether the value is number or not.
   * @param val - value to be checked.
   * @returns boolean
   */
  isNum(val: string) {
    return !isNaN(Number(val));
  }

  /**
   * @description Method invoked when '=' or enter key is pressed. Calculates the final result with `this.calcAnswer()` method and sets the value in subject.
   */
  getAnswer() {
    const lastKey = this.input[this.input.length - 1];
    if (!this.input || lastKey === '.') return;
    this.calcAnswer();

    this.input = this.result;
    if (this.isNum(this.input)) {
      this.calculatedValue$.next(this.input);
    }

    if (this.input === '0') this.input = '';
    this.valueExist = true;
  }

  calculate(expression: string): number {
    const tokens = this.tokenize(expression);
    const output: (number | string)[] = [];
    const operators: string[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const token of tokens) {
      if (this.isNumber(token)) {
        output.push(parseFloat(token));
      } else if (token === '(') {
        operators.push(token);
      } else if (token === ')') {
        while (operators.length && operators[operators.length - 1] !== '(') {
          this.applyOperator(output, operators.pop()!);
        }
        operators.pop(); // Remove '('
      } else if (this.isOperator(token)) {
        while (operators.length) {
          this.applyOperator(output, operators.pop()!);
        }
        operators.push(token);
      }
    }

    while (operators.length) {
      this.applyOperator(output, operators.pop()!);
    }

    if (output.length !== 1 || typeof output[0] !== 'number') {
      throw new Error('Invalid expression');
    }

    return output[0] as number;
  }

  private tokenize(expression: string): string[] {
    return expression.match(/(\d+\.?\d*|\+|-|\*|\/|\^|%|\(|\))/g) || [];
  }

  private isNumber(token: string): boolean {
    return !isNaN(parseFloat(token));
  }

  private isOperator(token: string): boolean {
    return token in this.operators;
  }

  private applyOperator(output: (number | string)[], operator: string) {
    if (output.length < 2) {
      throw new Error('Invalid expression: not enough operands');
    }
    const b = output.pop() as number;
    const a = output.pop() as number;
    output.push(this.operators[operator](a, b));
  }

  /**
   * @description Calculates the final result with `this.calcAnswer()` method and sets the value in subject.
   * And closes the dialog.
   */
  addValue() {
    this.calcAnswer();
    this.input = this.result;
    if (this.isNum(this.input)) {
      this.calculatedValue$.next(this.input);
    }

    this.dialogRef.close(this.formatCalculatorOutput(this.input));
    if (this.input === '0') this.input = '';
    this.valueExist = true;
  }

  private formatCalculatorOutput(value: string): string {
    // Convert to number to handle potential exponential notation
    let num = Number(value);

    // Check if the number is in exponential notation
    if (Math.abs(num) < 1e-6 || Math.abs(num) >= 1e21) {
      // Convert to full decimal representation
      let fullDecimal = num.toLocaleString();
      // Remove trailing zeros, commas and decimal point if necessary
      fullDecimal = fullDecimal.replace(/\.?0+(?=\.|$)|,/g, '');

      value = fullDecimal;
    }

    // Split the number into integer and decimal parts
    let [intPart, decPart] = value.split('.');

    // If the integer part is already outputDigitsCount or more characters, return just the integer part.
    // outputDigitsCount is to match the input length of the subject.
    if (intPart.length >= this.outputDigitsCount) {
      return intPart.slice(0, this.outputDigitsCount);
    }

    // Otherwise, include as much of the decimal part as possible
    if (decPart) {
      let remainingLength = this.outputDigitsCount - intPart.length - 1; // -1 for decimal point
      return `${intPart}.${decPart.slice(0, remainingLength)}`;
    }

    return intPart;
  }

  /**
   * @description Sets various keyboard bindings equivalent to calculator button presses.
   * @param event - keyboard event.
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    event.preventDefault();

    if (key === 'c' || key === 'backspace') {
      this.allClear();
    } else if (key === ',' || key === '.') {
      this.pressNum('.');
      // eslint-disable-next-line radix
    } else if (!isNaN(parseInt(key))) {
      this.pressNum(key);
    } else if (key === 'enter') {
      this.getAnswer();
    } else if (this.isOperator(key)) {
      this.pressOperator(key);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

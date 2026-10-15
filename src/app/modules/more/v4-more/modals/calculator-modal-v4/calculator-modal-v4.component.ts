import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, Subscription } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-calculator-modal-v4',
  standalone: true,
  imports: [CommonModule, MatDialogModule, LucideAngularModule, CommonButtonV4Component, CdkDrag, CdkDragHandle],
  templateUrl: './calculator-modal-v4.component.html',
  styleUrl: './calculator-modal-v4.component.scss'
})
export class CalculatorModalV4Component implements OnInit, OnDestroy {
  input = '';
  result = '';
  valueExist = false;
  copied = false;
  outputDigitsCount = 11;
  calculatedValue$ = new Subject<string>();
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
        this.valueExist = val !== '';
      })
    );
  }

  get displayValue(): string {
    return this.input || '0';
  }

  pressNum(num: string) {
    if (num === '.' && this.input === '') return;

    if (num === '.') {
      if (this.input !== '') {
        const lastNum = this.getLastOperand();
        if (lastNum.lastIndexOf('.') >= 0) return;
      }
    }

    if (num === '0') {
      if (this.input === '') return;
      const prevKey = this.input[this.input.length - 1];
      if (prevKey === '/' || prevKey === '*' || prevKey === '-' || prevKey === '+') return;
    }

    this.input = this.input + num;
    if (num !== '.' && this.isNum(this.input)) {
      this.calculatedValue$.next(this.input);
    }
    this.calcAnswer();
  }

  pressDoubleZero() {
    this.pressNum('0');
    this.pressNum('0');
  }

  getLastOperand() {
    let pos = this.input.toString().lastIndexOf('+');
    if (this.input.toString().lastIndexOf('-') > pos) pos = this.input.lastIndexOf('-');
    if (this.input.toString().lastIndexOf('*') > pos) pos = this.input.lastIndexOf('*');
    if (this.input.toString().lastIndexOf('/') > pos) pos = this.input.lastIndexOf('/');
    return this.input.substr(pos + 1);
  }

  pressOperator(op: string) {
    const inputString = typeof this.input === 'string' ? this.input : String(this.input);
    if (inputString.trim() === '') return;

    const lastKey = this.input[this.input.length - 1];
    if (lastKey === '/' || lastKey === '*' || lastKey === '-' || lastKey === '+' || lastKey === '.') return;

    this.input += op;
  }

  clear() {
    if (this.input !== '') {
      this.input = this.input.substr(0, this.input.length - 1);
      this.calculatedValue$.next(this.input);
    }
  }

  allClear() {
    this.result = '';
    this.input = '';
    this.calculatedValue$.next(this.input);
  }

  calcAnswer() {
    let formula = this.input;
    let lastKey = formula[formula.length - 1];

    if (lastKey === '.') formula = formula.substr(0, formula.length - 1);
    lastKey = formula[formula.length - 1];
    if (lastKey === '/' || lastKey === '*' || lastKey === '-' || lastKey === '+' || lastKey === '.') {
      formula = formula.substr(0, formula.length - 1);
    }

    try {
      const output = this.calculate(formula);
      this.result = String(output);
    } catch {
      // invalid mid-expression, keep previous result
    }
  }

  getAnswer() {
    const lastKey = this.input[this.input.length - 1];
    if (!this.input || lastKey === '.') return;
    this.calcAnswer();
    this.input = this.result;
    if (this.isNum(this.input)) this.calculatedValue$.next(this.input);
    if (this.input === '0') this.input = '';
    this.valueExist = true;
  }

  copyResult() {
    const valueToCopy = this.result || this.input || '0';
    navigator.clipboard.writeText(valueToCopy).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    });
  }

  calculate(expression: string): number {
    const tokens = this.tokenize(expression);
    const output: (number | string)[] = [];
    const ops: string[] = [];

    for (const token of tokens) {
      if (this.isNumber(token)) {
        output.push(parseFloat(token));
      } else if (token === '(') {
        ops.push(token);
      } else if (token === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') {
          this.applyOperator(output, ops.pop()!);
        }
        ops.pop();
      } else if (this.isOperator(token)) {
        while (ops.length) {
          this.applyOperator(output, ops.pop()!);
        }
        ops.push(token);
      }
    }

    while (ops.length) {
      this.applyOperator(output, ops.pop()!);
    }

    if (output.length !== 1 || typeof output[0] !== 'number') throw new Error('Invalid expression');
    return output[0] as number;
  }

  private tokenize(expression: string): string[] {
    return expression.match(/(\d+\.?\d*|\+|-|\*|\/|\^|%|\(|\))/g) || [];
  }

  private isNumber(token: string): boolean {
    return !isNaN(parseFloat(token));
  }

  isNum(val: string): boolean {
    return !isNaN(Number(val));
  }

  private isOperator(token: string): boolean {
    return token in this.operators;
  }

  private applyOperator(output: (number | string)[], operator: string) {
    if (output.length < 2) throw new Error('Invalid expression: not enough operands');
    const b = output.pop() as number;
    const a = output.pop() as number;
    output.push(this.operators[operator](a, b));
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    event.preventDefault();

    if (key === 'c' || key === 'backspace') {
      this.allClear();
    } else if (key === ',' || key === '.') {
      this.pressNum('.');
    } else if (!isNaN(parseInt(key))) {
      this.pressNum(key);
    } else if (key === 'enter') {
      this.getAnswer();
    } else if (this.isOperator(key)) {
      this.pressOperator(key);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

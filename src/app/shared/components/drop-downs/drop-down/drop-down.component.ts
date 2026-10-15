import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import {
  FormsModule,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';

/**
 * @description Component for drop down.
 */
@Component({
  standalone: true,
  selector: 'app-drop-down',
  imports: [NgSelectModule, FormsModule, CommonModule],
  templateUrl: './drop-down.component.html',
  styleUrls: ['./drop-down.component.scss']
})
export class DropDownComponent implements OnInit {
  @Input() data: string[] = [];
  @Input() placeholder = 'Select';
  @Input() appendTo = 'ng-select';

  @Input() addTag = false;
  @Input() name = 'id';
  @Input() selectedItem: any;

  @Output() event = new EventEmitter();

  @Input() controlName!: string;
  public form!: UntypedFormGroup;
  public control!: UntypedFormControl;

  @Output() searchEvent = new EventEmitter();
  @Output() selectionChange = new EventEmitter();
  @Output() scrollEvent = new EventEmitter();
  @Output() clearChange = new EventEmitter();

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;


  //............load first 10 data..............

  ngOnInit(): void {
    this.selectedItem;
    if (
      this.selectedItem == null ||
      this.selectedItem == undefined ||
      this.selectedItem == ''
    ) {
      this.selectedItem = null;
    }
  }

  /**
   * @description Emits `selectionChange` event when change happens in ng-select in template.
   * @param event - event triggered by change.
   */
  getChange(event: any) {
    this.selectionChange.emit(event);
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.scrollEvent.emit();
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: any) {
    this.searchEvent.emit(event);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.clearChange.emit();
  }

  //.........................how to use in parent component............

  //<app-drop-down placeholder="enter...." [data]="arrayName" (scrollEvent)="function1()" (searchEvent)="function2($event)" (selectionChange)="function3($event)" [selectedItem]="id"></app-drop-down>

  // .ts

  // id:string; --> id must declare in ts file like this.

  //function1(){}...
  //function2(event:any){consol.log(event)}...
  //

  onChange(v: any) {
    this.selectionChange.emit(v);
  }

  clearSelectedItem() {
    this.selectedItem = null;
    this.ngSelectComponent.handleClearClick();
  }

}

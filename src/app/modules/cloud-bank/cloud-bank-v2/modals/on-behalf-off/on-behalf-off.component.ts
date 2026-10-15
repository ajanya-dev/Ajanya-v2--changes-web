import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Component for managing on behalf of names in a modal dialog.
 */
@Component({
  selector: 'app-on-behalf-off',
  templateUrl: './on-behalf-off.component.html',
  styleUrls: ['./on-behalf-off.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions
  ]
})
export class OnBehalfOffComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  name: string;
  form: UntypedFormGroup;
  editMode = false;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public injectedData: string,
    private _fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  /**
   * @description Checks if the component is in edit mode.
   */
  checkEditMode(): void {
    if (this.injectedData) {
      this.editMode = true;
      this.setData();
    } else {
      this.editMode = false;
    }
  }

  /**
   * @description Initializes the form for managing on behalf of names.
   */
  initForm(): void {
    this.form = this._fb.group({
      name: ['', [Validators.required]]
    });
  }

  /**
   * @description Sets data for the form when in edit mode.
   */
  setData(): void {}

  /**
   * @description Handles form submission for adding or editing an on behalf of name.
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.editMode) {
      this.editOnBeHalfOfName();
    } else {
      this.addOnBeHalfOfName();
    }
  }

  /**
   * @description Adds a new on behalf of name.
   */
  addOnBeHalfOfName(): void {}

  /**
   * @description Edits an existing on behalf of name.
   */
  editOnBeHalfOfName(): void {}

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el.unsubscribe());
  }
}

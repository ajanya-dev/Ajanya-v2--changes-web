import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { debounceTime } from 'rxjs/operators';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { Utils } from 'src/app/data/utils';
import { ICheckDesignObjects } from 'src/app/models/check-design';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgIf, NgFor, NgClass } from '@angular/common';

/**
 * @description Represents the TextMenuComponent which handles text editing and routing number updates.
 */
@Component({
  selector: 'app-text-menu',
  templateUrl: './text-menu.component.html',
  styleUrls: ['./text-menu.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    NgFor,
    NgClass,
    ColorPickerModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ]
})
export class TextMenuComponent implements OnInit {
  mode = 'new';
  allowTextEdit = true;

  colorPicker = '#000';
  fonts = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Courier New',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
  ] as const;
  
  selectedFontFamily: string = this.fonts[0];
  selectedFontSize = 16;
  fontStyle = { fontWeight: 'normal', italic: 'normal', underline: false };
  textAlign = 'left';
  areaFeildText = '';

  routingForm: UntypedFormGroup;
  routingNum: string;
  bankAccNum: string;
  maxMinRoutingPos = {
    minl: 67,
    maxl: 107,
    mint: 226,
    maxt: 266
  };

  updateDynamicTimeout: ReturnType<typeof setTimeout>;
  maxLength: number | undefined;

  utils = Utils;

  constructor(
    public canvasService: CheckdesignCanvasService,
    public alertService: AlertService,
    public fb: UntypedFormBuilder,
    private checkDesignService: CheckDesignService
  ) {}

  ngOnInit(): void {
    this.onActiveMenuAction();
  }

  /**
   * @description Listens for active menu changes and performs corresponding actions.
   */
  onActiveMenuAction() {
    this.canvasService.activeMenu$.subscribe((menu) => {
      if (menu.name !== 'menu-text') {
        return;
      }
      this.maxLength = undefined;
      this.mode = menu.mode;

      if (this.mode === 'new') {
        this.areaFeildText = '';
        this.allowTextEdit = true;
      }

      if (menu.mode === 'edit') {
        this.editMenu(menu.activeObject as ICheckDesignObjects);
        if (Object.prototype.hasOwnProperty.call(menu, 'textEdit')) {
          this.allowTextEdit = menu.textEdit as boolean;
        } else {
          this.allowTextEdit = true;
        }
      } else if (menu.mode === 'routing_no') {
        this.routingNumEdit(menu.activeObject as ICheckDesignObjects);
        this.routingChange();
      }
    });
  }

  //= =============== ROUTING EDIT START ================//

  /**
   * @description Prepares the form for editing routing number information.
   * @param activeObject - The active object to be edited.
   */
  routingNumEdit(activeObject: ICheckDesignObjects) {
    let routeNum = activeObject.text?.split('&');
    const splittedRoute = routeNum?.length > 1 ? routeNum[1] : '';
    routeNum = splittedRoute?.match(/\d+/) ?? [];
    this.routingNum = routeNum[0];
    this.bankAccNum = this.canvasService.bankVariables.bankAccountNumber;
    this.routingForm = this.fb.group({
      routingNum: [
        routeNum[0],
        [
          Validators.required,
          ValidationService.routingNumberValidator,
          Validators.maxLength(9)
        ]
      ],
      bankAccountNumber: [
        this.canvasService.bankVariables.bankAccountNumber,
        [Validators.required, Validators.minLength(5), Validators.maxLength(24)]
      ],
      checkSerialNumber: [
        this.canvasService.bankVariables.checkSerialNumber,
        [Validators.required]
      ],
      top: [activeObject.top, [Validators.required]],
      left: [activeObject.left, [Validators.required]]
    });
  }

  /**
   * @description Sets up form controls for routing number changes and subscribes to their value changes.
   * and updates the routing number accordingly
   */
  routingChange() {
    this.routingForm.controls.routingNum.valueChanges
      .pipe(debounceTime(800))
      .subscribe(() => {
        if (this.routingForm.controls.routingNum.valid) {
          this.updateRoutingNum(this.routingForm.controls.routingNum.value, 1);
        }
      });

    this.routingForm.controls.bankAccountNumber.valueChanges
      .pipe(debounceTime(800))
      .subscribe(() => {
        if (this.routingForm.controls.bankAccountNumber.valid) {
          this.updateRoutingNum(
            this.routingForm.controls.bankAccountNumber.value,
            2
          );
        }
      });

    this.routingForm.controls.checkSerialNumber.valueChanges
      .pipe(debounceTime(2000))
      .subscribe(() => {
        if (
          this.routingForm.controls.checkSerialNumber.valid &&
          this.routingForm.controls.checkSerialNumber.value !== '0'
        ) {
          this.updateRoutingNum(
            this.routingForm.controls.checkSerialNumber.value,
            3
          );
        }
      });

    this.routingForm.controls.top.valueChanges
      .pipe(debounceTime(800))
      .subscribe(() => this.updateRoutingPos('top'));

    this.routingForm.controls.left.valueChanges
      .pipe(debounceTime(800))
      .subscribe(() => this.updateRoutingPos('left'));
  }

  /**
   * @description Updates the routing number and bank account number on the canvas and server.
   * @param data - The updated data (routing number or bank account number).
   * @param type - The type of update: 1 for routing number, 2 for bank account number.
   */
  updateRoutingNum(data: string, type: number) {
    const activeObject = this.canvasService.getActiveObject();
    const text = `(0000000000) &${this.routingForm.controls.routingNum.value}& (${this.routingForm.controls.bankAccountNumber.value})`;
    activeObject.set({ text });
    activeObject.set({ width: 500 });
    this.canvasService.renderAll();

    this.updateRoutingNumServer(
      this.canvasService.bankVariables.bankAccountId,
      data,
      type
    );
  }

  /**
   * @description Updates the routing number on the server.
   * @param bankAccountId - The bank account ID.
   * @param data - The updated data (routing number or bank account number).
   * @param type - The type of update: 1 for routing number, 2 for bank account number.
   */
  updateRoutingNumServer(bankAccountId: string, data: string, type: number) {
    this.checkDesignService
      .updateRouting(bankAccountId, data, type)
      .subscribe();
  }

  /**
   * @description Adjusts the routing position based on operator and control name.
   * @param operator - The operator to determine whether to increment or decrement.
   * @param controlName - The name of the control being adjusted (left or top).
   */
  routingPos(operator: string, controlName: string) {
    const { minl, maxl, mint, maxt } = this.maxMinRoutingPos;

    if (
      (operator === '-' &&
        controlName === 'left' &&
        this.routingForm.controls[controlName].value - 1 < minl) ||
      (operator === '-' &&
        controlName === 'top' &&
        this.routingForm.controls[controlName].value - 1 < mint) ||
      (operator === '+' &&
        controlName === 'left' &&
        this.routingForm.controls[controlName].value + 1 > maxl) ||
      (operator === '+' &&
        controlName === 'top' &&
        this.routingForm.controls[controlName].value + 1 > maxt)
    ) {
      return;
    }

    this.routingForm.controls[controlName].setValue(
      operator === '-'
        ? this.routingForm.controls[controlName].value - 1
        : this.routingForm.controls[controlName].value + 1
    );
  }

  /**
   * @description Updates the routing position (left or top) of the active routing object.
   * @param pos - The position being updated (left or top).
   */
  updateRoutingPos(pos: string) {
    const { minl, maxl, mint, maxt } = this.maxMinRoutingPos;

    if (pos === 'left') {
      const val = this.routingForm.controls.left.value;
      if (val < minl || val > maxl) {
        this.alertService.warningAlert({
          title: 'Oops..',
          content: `Left position must be between ${minl} and ${maxl}`
        });
        this.routingForm.controls.left.setValue(val < minl ? minl : maxl);
        return;
      }
      const activeObject = this.canvasService.getActiveObject();
      if (activeObject) {
        activeObject.set({ left: Number(val) });
        this.canvasService.renderAll();
      }
    } else if (pos === 'top') {
      const val = this.routingForm.controls.top.value;
      if (val < mint || val > maxt) {
        this.alertService.warningAlert({
          title: 'Oops..',
          content: `Top position must be between ${mint} and ${maxt}`
        });
        this.routingForm.controls.top.setValue(val < mint ? mint : maxt);
        return;
      }
      const activeObject = this.canvasService.getActiveObject();
      if (activeObject) {
        activeObject.set({ top: Number(val) });
        this.canvasService.renderAll();
      }
    }
  }

  /**
   * @description Displays a warning message for actions not allowed on verified bank accounts.
   */
  showWarning() {
    if (!this.canvasService.bankVariables.bankAccountIsVerified) {
      return;
    }
    this.alertService.warningAlert({
      title: 'Oops...',
      content:
        'Bank Account Number and Routing Number is not editable for verified bank account. You can delete this account and add a new one.',
      close: true
    });
  }

  //= =============== ROUTING EDIT END ================//

  //= =============== TEXT EDIT START ================//

  /**
   * @description Prepares the properties for editing text properties.
   * @param activeObject - The active object to be edited.
   */
  editMenu(activeObject: ICheckDesignObjects) {    
    this.selectedFontFamily = activeObject.fontFamily;
    this.selectedFontSize = activeObject.fontSize;
    this.fontStyle.fontWeight = activeObject.fontWeight;
    this.fontStyle.italic = activeObject.fontStyle;
    this.fontStyle.underline = activeObject.underline;
    this.areaFeildText = activeObject.text;
    this.colorPicker = activeObject.fill as string;
    if (activeObject?.id === "dynamic['business_name']") {
      this.maxLength = 60;
    } else if (activeObject?.id === "dynamic['bank_name']") {
      this.maxLength = 45;
    } else if (activeObject?.id === "dynamic['business_address']") {
      this.maxLength = 185;
    } else {
      this.maxLength = undefined;
    }
  }

  /**
   * @description Adds a new text object to the canvas.
   */
  addText() {
    if (!this.areaFeildText) {
      this.alertService.warningAlert({
        title: 'Oops..',
        content: `Please enter some Text`
      });
      return;
    }

    const textOptions: fabric.ITextOptions & { id: string } = {
      id: 'txt',
      left: 150,
      top: 350,
      fontSize: this.selectedFontSize,
      fontFamily: this.selectedFontFamily,
      fill: this.colorPicker,
      fontWeight: this.fontStyle.fontWeight,
      fontStyle: this.fontStyle.italic as fabric.ITextOptions['fontStyle'],
      underline: this.fontStyle.underline,
      textAlign: this.textAlign,
      originX: 'left',
      originY: 'top',
      opacity: 1
    };

    this.canvasService.addText(this.areaFeildText, textOptions);
    this.canvasService.renderAll();
  }

  /**
   * @description Adds a new interactive text (iText) object to the canvas.
   */
  addItext() {
    if (!this.areaFeildText) {
      this.alertService.warningAlert({
        title: 'Oops..',
        content: `Please enter some Text`
      });
      return;
    }

    const fontStyle: 'normal' | 'italic' =
      this.fontStyle.italic === 'italic' ? 'italic' : 'normal';
    const options = {
      left: 150,
      top: 350,
      fontSize: this.selectedFontSize,
      fontFamily: this.selectedFontFamily,
      fill: this.colorPicker,
      fontWeight: this.fontStyle.fontWeight,
      fontStyle,
      underline: this.fontStyle.underline,
      textAlign: this.textAlign
    };
    this.canvasService.addIText(this.areaFeildText, options);
  }

  /**
   * @description Changes the font style (bold, italic, underline) of the active text object.
   * @param style - The style to change (bold, italic, underline).
   * @param type - The type of style being changed.
   */
  changeFontStyle(style: string, type?: string) {
    let value: string | boolean = '';
    if (style === 'bold') {
      this.fontStyle.fontWeight =
        this.fontStyle.fontWeight === 'normal' ? 'bold' : 'normal';
      value = this.fontStyle.fontWeight;
    } else if (style === 'italic') {
      this.fontStyle.italic =
        this.fontStyle.italic === 'normal' ? 'italic' : 'normal';
      value = this.fontStyle.italic;
    } else if (style === 'underline') {
      this.fontStyle.underline = !this.fontStyle.underline;
      value = this.fontStyle.underline;
    }

    const activeObject = this.canvasService.getActiveObject();

    if (
      (activeObject?.setSelectionStyles as unknown) &&
      activeObject.isEditing &&
      type
    ) {
      this.setInteractiveStyle(activeObject, {
        [type]: value
      });
      return;
    }

    this.updateText();
  }

  /**
   * @description Changes the font size of the active text object.
   * @param increment - Whether to increment or decrement the font size.
   */
  changeFontSize(increment: boolean) {
    if (!this.selectedFontSize) {
      this.selectedFontSize = 1;
      return;
    }

    if (
      (increment && this.selectedFontSize * 1 + 1 > 100) ||
      (!increment && this.selectedFontSize * 1 - 1 < 0)
    ) {
      return;
    }

    this.selectedFontSize += increment ? 1 : -1;
    this.fontSizeChange();
  }

  /**
   * @description Updates the font size of the active text object.
   */
  fontSizeChange() {
    const activeObject = this.canvasService.getActiveObject();

    if (
      (activeObject?.setSelectionStyles as unknown) &&
      activeObject.isEditing
    ) {
      this.setInteractiveStyle(activeObject, {
        fontSize: this.selectedFontSize
      });
      return;
    }

    this.updateText();
  }

  /**
   * @description Changes the text alignment of the active text object.
   * @param align - The alignment to set (left, center, right).
   */
  changeAlignment(align: string) {
    const activeObject = this.canvasService.getActiveObject();
    if (
      (activeObject?.setSelectionStyles as unknown) &&
      activeObject.isEditing
    ) {
      return;
    }
    this.textAlign = align;
    this.updateText();
  }

  /**
   * @description Changes the font family of the active text object.
   * @param font - The new font family.
   */
  changeFontFamily(font: string) {
    this.selectedFontFamily = font;
    const activeObject = this.canvasService.getActiveObject();
    if (
      (activeObject?.setSelectionStyles as unknown) &&
      activeObject.isEditing
    ) {
      this.setInteractiveStyle(activeObject, {
        fontFamily: this.selectedFontFamily
      });
      return;
    }
    this.updateText();
  }

  /**
   * @description Handles color changes for the active text object.
   */
  colorPickerChange() {
    const activeObject = this.canvasService.getActiveObject();
    if (!activeObject) {
      return;
    }

    if (
      (activeObject?.setSelectionStyles as unknown) &&
      activeObject.isEditing
    ) {
      this.setInteractiveStyle(activeObject, { fill: this.colorPicker });
      return;
    }

    this.updateText();
  }

  /**
   * @description Applies interactive styling changes to the active text object.
   * @param activeObject - The active text object.
   * @param style - The style changes to apply.
   */
  setInteractiveStyle(
    activeObject: ICheckDesignObjects,
    style: Record<string, unknown>
  ) {
    activeObject?.setSelectionStyles(style);
    activeObject.setCoords();
    this.canvasService.renderAll();
  }

  /**
   * @description Updates the text properties of the active text object.
   * @param type - The type of update being performed.
   */
  updateText(type?: string) {
    if (this.mode !== 'edit') {
      return;
    }

    if (!this.areaFeildText.length) {
      this.alertService.warningAlert({
        title: 'Oops',
        content: 'Please enter some text',
        close: true
      });
      return;
    }

    const activeObject = this.canvasService.getActiveObject();
    const text = this.areaFeildText.trim();

    activeObject.set({
      text,
      fontSize: this.selectedFontSize,
      fontFamily: this.selectedFontFamily,
      fill: this.colorPicker,
      fontWeight: this.fontStyle.fontWeight,
      fontStyle: this.fontStyle.italic,
      underline: this.fontStyle.underline,
      textAlign: this.textAlign,
      opacity: 1
    });

    const dynamicIds = [
      "dynamic['business_name']",
      "dynamic['business_address']",
      "dynamic['bank_name']",
      "dynamic['fractional_no']"
    ];

    if (dynamicIds.includes(activeObject.id) && !type) {
      this.updateDynamic(text, activeObject.id);
    }

    this.canvasService.renderAll();
  }

  /**
   * @description Updates dynamic text fields and sends updates to the server.
   * @param text - The updated text value.
   * @param activeId - The ID of the text field being updated.
   */
  updateDynamic(text: string, activeId: string) {
    clearTimeout(this.updateDynamicTimeout);

    const { bankAccountAddress } = this.canvasService.bankVariables;
    const { bankAccountName } = this.canvasService.bankVariables;

    const objects = this.canvasService.getObjects();
    let dynamicType = '';

    objects?.forEach((object) => {
      if (object.id === activeId) {
        object.text = text;
      }

      if (
        object.id == "dynamic['envelop_window_address_from']" &&
        activeId === "dynamic['business_name']"
      ) {
        let bankAddress = '';
        for (const line of bankAccountAddress?.split('\\n')) {
          bankAddress += `${line}\n`;
        }
        object.text = `${text}                   \n${bankAddress}                   `;
        dynamicType = 'business_name';
      }

      if (
        object.id == "dynamic['envelop_window_address_from']" &&
        activeId === "dynamic['business_address']"
      ) {
        let formattedAddress = '';
        for (const line of text?.split('\\n')) {
          formattedAddress += `${line}\n`;
        }
        object.text = `${bankAccountName}                   \n${formattedAddress}                   `;
        dynamicType = 'business_address';
      }
    });

    this.canvasService.renderAll();

    if (activeId === "dynamic['bank_name']") {
      dynamicType = 'bank_name';
    } else if (activeId === "dynamic['fractional_no']") {
      dynamicType = 'fractional_no';
    } else if (activeId === "dynamic['business_name']") {
      dynamicType = 'business_name';
    } else if (activeId === "dynamic['business_address']") {
      dynamicType = 'business_address';
    }

    this.updateDynamicTimeout = setTimeout(() => {
      this.checkDesignService
        .updateDynamic(
          this.canvasService.bankVariables.bankAccountId,
          text,
          dynamicType
        )
        .subscribe();
    }, 3000);
  }

  /**
   * @description Checks if the key event represents a valid numeric input.
   * @param evt - The keyboard event.
   * @returns `true` if the input is a valid number, `false` otherwise.
   */
  isNumber(evt: KeyboardEvent) {
    const event = evt || window.event;
    const charCode =
      (event as KeyboardEvent)?.which ?? (event as KeyboardEvent)?.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Displays an information message when attempting to edit verified bank account info.
   */
  openInfoOnEdit() {
    this.alertService.infoAlert({
      content: `To Edit your Bank Account, go back and click on "Edit button". But remember, if your Bank Account has already been verified, you can't make changes to it. You can still add new bank accounts or remove old ones, though!`
    });
  }
}

import { Subscription } from 'rxjs';
import { DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import {
  ICanvasDynamicElement,
  ICanvasDynamicRemittance,
  ICanvasStaticElement,
  ICanvasSubItem
} from 'src/app/modules/check/model/check';
import { EditCheckDesignService } from 'src/app/shared/service/check-design/check-design-data.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { AddCustomElementComponent } from 'src/app/modules/check-design/modals/add-custom-element/add-custom-element.component';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  ICustomData,
  ICustomRestrictions
} from 'src/app/modules/check/model/check';
import { IApiRes } from 'src/app/models/api';
import {
  ICheckDesign,
  ICheckDesignData,
  ICheckDesignObjects
} from 'src/app/models/check-design';
import { FormsModule } from '@angular/forms';

interface IElements {
  static: ICanvasStaticElement[];
  dynamic: ICanvasDynamicElement[];
  dynamicRemittance: ICanvasDynamicRemittance[];
  custom: { id: number; element: string; checked: boolean }[];
  remittanceExpanded: boolean;
}

interface ITextOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  id?: string;
  showTextBoxBorder?: boolean;
  left?: number;
  top?: number;
  textboxBorderColor?: string;
}

/**
 * @description Represents the Elements Menu component responsible for handling design elements.
 */
@Component({
  selector: 'app-elements-menu',
  templateUrl: './elements-menu.component.html',
  styleUrls: ['./elements-menu.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgStyle]
})
export class ElementsMenuComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: ICheckDesignData;

  elements = {} as IElements;
  subscription: Subscription[] = [];
  bankAccountId: string;

  colorPicker = '#000';
  fonts = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Courier',
    'Courier New',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Impact'
  ];
  selectedFontFamily: string = this.fonts[0];
  selectedFontSize = 16;
  fontStyle = { fontWeight: 'normal', italic: 'normal', underline: false };
  textAlign = 'left';
  areaFeildText = '';

  designData: ICheckDesignData;
  designElements: string[] = [];

  customElementRestriction: {
    enable_custom_elements: number;
    custom_elements_limit: number;
  } = { enable_custom_elements: 0, custom_elements_limit: 0 };
  customerSupportUrl =
    'https://salesiq.zoho.com/signaturesupport.ls?widgetcode=f903324a76eafa8fc529ce86181cd28effd407c2d1dec74dd5d207aa2bc4053ced006e8f7453db8a5a8cf05af2086f4c';

  constructor(
    public checkDesignData: EditCheckDesignService,
    public checkDesignService: CheckDesignService,
    public canvasService: CheckdesignCanvasService,
    public datePipe: DatePipe,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    public alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.elements.static = this.checkDesignData.staticElements;
    this.elements.dynamic = this.checkDesignData
      .dynamicElements as ICanvasDynamicElement[];
    this.elements.dynamicRemittance = this.checkDesignData.dynamicRemittance;

    this.bankAccountId = this.route.snapshot.params.id;
    this.subscription.push(
      this.checkDesignService
        .getCustomRestriction()
        .subscribe((res: IApiRes<ICustomRestrictions>) => {
          if (res.success) {
            this.customElementRestriction.enable_custom_elements = parseInt(
              res.data.enable_custom_elements
            );
            this.customElementRestriction.custom_elements_limit = parseInt(
              res.data.custom_elements_limit
            );
          }
        }),
      this.checkDesignService
        .getDesign(this.bankAccountId)
        .subscribe(async (data) => {
          this.designData = data.data;
          let designDatacheckDesign;
          try {
            designDatacheckDesign = JSON.parse(
              this.designData.checkDesign as string
            );
            if (
              (this.designData.checkDesign as ICheckDesign)?.backgroundImage
                ?.src
            ) {
              this.canvasService.initialBackgroundMeta =
                await this.canvasService.getImageNaturalSize(
                  (this.designData.checkDesign as ICheckDesign)?.backgroundImage
                    ?.src ?? ''
                );
            }
          } catch {
            designDatacheckDesign = {};
          }
          this.designElements = designDatacheckDesign.objects.map(
            (item: { text: string }) => {
              return item.text;
            }
          );
          this.checkDesignService
            .getCustomElements()
            .subscribe((res: IApiRes<ICustomData>) => {
              if (res.success) {
                this.elements.custom = res.data.custom_elements.map(
                  (item: { id: number; custom_element: string }) => {
                    return {
                      id: item.id,
                      element: item.custom_element,
                      checked: this.designElements.includes(item.custom_element)
                        ? true
                        : false
                    };
                  }
                );
              }
            });
        })
    );
  }

  ngOnChanges() {
    this.elements.static?.forEach((element: ICanvasStaticElement) => {
      element.checked = false;
    });
    this.elements.dynamic?.forEach((element: ICanvasDynamicElement) => {
      element.checked = false;
    });
    (this.data?.checkDesign as ICheckDesign)?.objects.forEach((obj) => {
      this.updateElementCheckedStatus(obj);
    });
  }

  /**
   * @description Update the checked status of design elements based on data.
   * @param obj - CheckDesignObjects to update.
   */
  updateElementCheckedStatus(obj: ICheckDesignObjects) {
    // PAY TO THE ORDER
    if (obj.id === "static['pay_to_the_order']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          this.subItemTextCheck(i, obj);
          break;
        }
      }
    }

    // DATE
    else if (obj.id === "static['date']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          this.subItemTextCheck(i, obj);
          break;
        }
      }
    }

    // DOLLARS
    else if (obj.id === "static['dollar']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          this.subItemTextCheck(i, obj);
          break;
        }
      }
    }

    //MEMO
    else if (obj.id === "static['memo']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          this.subItemTextCheck(i, obj);
          break;
        }
      }
    }

       //Note
    else if (obj.id === "static['note']") {
        for (let i = 0; i < this.elements.static.length; i += 1) {
          if (this.elements.static[i].id === obj.id) {
            if (obj.opacity === 1) {
              this.elements.static[i].checked = true;
            }
            this.subItemTextCheck(i, obj);
            break;
          }
        }
    }

    //SIGNATURE LINE
    else if (obj.id === "static['signature']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          this.subItemTextCheck(i, obj);
          break;
        }
      }
    }

    // VOID AFTER
    else if (obj.id === "static['void_after']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          this.subItemTextCheck(i, obj);
          break;
        }
      }
    }

    // $ BOX and $ sign
    else if (obj.id === "static['amount_box_sign']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.static[i].checked = true;
          }
          const subElements = this.elements.static[i]
            .sub_items as ICanvasSubItem[];
          if (subElements && subElements.length) {
            for (let j = 0; j < subElements.length; j++) {
              if (subElements[j].name === '$ Sign' && obj.opacity === 1) {
                subElements[j].checked = true;
              }
            }
          }
          break;
        }
      }
    }

    // With BOX
    else if (obj.id === "static['amount_box_box']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === "static['amount_box_sign']") {
          const subElements = this.elements.static[i]
            .sub_items as ICanvasSubItem[];
          for (let j = 0; j < subElements.length; j++) {
            if (subElements[j].name === 'With Box' && obj.opacity === 1) {
              subElements[j].checked = true;
            }
          }
          break;
        }
      }
    }

    // With LINE
    else if (obj.id === "static['amount_box_line']") {
      for (let i = 0; i < this.elements.static.length; i++) {
        if (this.elements.static[i].id === "static['amount_box_sign']") {
          const subElements = this.elements.static[i]
            .sub_items as ICanvasSubItem[];
          for (let j = 0; j < subElements.length; j++) {
            if (subElements[j].name === 'With Line' && obj.opacity === 1) {
              subElements[j].checked = true;
            }
          }
          break;
        }
      }
    }

    // ROUTING NUMBER
    else if (obj.id === "dynamic['bank_account_routing_no']") {
      for (let i = 0; i < this.elements.dynamic.length; i++) {
        if (this.elements.dynamic[i].id === obj.id) {
          if (obj.opacity === 1) {
            this.elements.dynamic[i].checked = true;
          }
          break;
        }
      }
    }
  }

  /**
   * @description Update the checked status of sub item texts based on data.
   * @param index - index of static elements.
   * @param obj - CheckDesignObjects to update.
   */
  subItemTextCheck(index: number, obj: ICheckDesignObjects) {
    const subElements = this.elements.static[index]
      .sub_items as ICanvasSubItem[];
    subElements.forEach((subItem) => {
      if (obj.text.includes('__________') && subItem.name === 'With Line') {
        subItem.checked = true;
      }

      if (obj.fontWeight === 'bold' && subItem.name === 'Bold') {
        subItem.checked = true;
      }

      if (obj.fontStyle === 'italic' && subItem.name === 'Italic') {
        subItem.checked = true;
      }

      if (obj.fontStyle === 'underline' && subItem.name === 'Underline') {
        subItem.checked = true;
      }

      // Only for signature
      if (obj.id === "static['signature']") {
        if (obj.text.includes('MP') && subItem.name === 'With MP') {
          subItem.checked = true;
        }

        if (
          obj.text.includes('AUTHORIZED') &&
          subItem.name === 'With Authorized'
        ) {
          subItem.checked = true;
        }
      }
    });
  }

  /**
   * @description Handles changes in the void days value and updates the corresponding object's text on the canvas.
   * @param e - The input change event.
   * @param item - The canvas sub-item related to the void days.
   */
  voidDaysChange(
    e: Event & { target: HTMLInputElement },
    item: ICanvasSubItem
  ) {
    const days = e.target?.value;

    item.days = days;
    if (days?.toString().length > 3) {
      const daysStr = days.toString().slice(0, 3);
      item.days = parseInt(daysStr);
      e.target.value = daysStr;
    }

    this.canvasService.getObjects().forEach((o) => {
      if (o.id === "static['void_after']") {
        this.canvasService.setActiveObject(o);
      }
    });

    const activeObject = this.canvasService?.getActiveObject();
    activeObject?._set('text', `Void After ${item.days.toString()} days`);
    this.canvasService.renderAll();
  }

  /**
   * @description Adds a dynamic element to the canvas.
   * @param elm - The type of dynamic element to add.
   * @param txt - The text or content of the dynamic element.
   */
  addDynamic(elm: string, txt: string | number) {
    if (!txt) {
      if (elm === 'business_name') {
        txt = this.data.bankAccountName;
      } else if (elm === 'business_address') {
        txt = this.data.bankAccountAddress;
      } else if (elm === 'date') {
        txt = this.getDate();
      } else if (elm === 'bank_name') {
        txt = this.data.bankName;
      } else if (elm === 'fractional_no') {
        txt = '<Fractional No.>';
      } else if (elm === 'envelop_window_address_from') {
        txt = `${this.data.bankAccountName}                   \n${this.data.bankAccountAddress}                   `;
      } else if (elm === 'envelop_window_address_to') {
        txt = `<Pay to Name>\n<Pay to Company Name>\n<Pay to Address>\n<Pay to City, State, Zip>                                                             `;
      }
      txt = txt?.toString().replace(/\\n/g, '\n');
    }

    let textOptions = {} as ITextOptions;
    if (elm === 'stub') {
      this.stub1(txt);
    } else if (elm === 'qrcode') {
      const qrUrl = `${environment.rootUrl}/loadImageNoAuth?the_img=https://app.onlinecheckwriter.com/asset/checkdesignnew/images/qr_code_dummy.png`;

      const shapeOptions = this.canvasService.objectProperties();
      shapeOptions.id = "dynamic['qrcode']";
      shapeOptions.left = 100;
      shapeOptions.top = 196;
      shapeOptions.height = 40;
      shapeOptions.width = 40;

      this.canvasService.addImage(qrUrl, undefined, shapeOptions);
    } else if (elm === 'remittance_stub') {
      this.remittanceStub();
    } else {
      textOptions = {
        id: "dynamic['" + elm + "']",
        left: 250,
        top: 320,
        fontSize: 11,
        fontFamily: 'Helvetica'
      };
      if (elm == 'envelop_window_address_to') {
        textOptions.left = 125;
        textOptions.top = 455;
        textOptions.showTextBoxBorder = true;
        textOptions.textboxBorderColor = '#aaa';
      }
      if (elm == 'envelop_window_address_from') {
        textOptions.left = 95;
        textOptions.top = 335;
        textOptions.showTextBoxBorder = true;
        textOptions.textboxBorderColor = '#aaa';
      }
      if (txt === 'currentDate') {
        txt = this.datePipe.transform(new Date(), 'MM/dd/YYYY')!;
      }
      this.canvasService.addText(txt?.toString(), textOptions);
    }
    this.canvasService.renderAll();
  }

  /**
   * @description Toggles the state of an element based on its ID and type.
   * @param id - The unique ID of the element.
   * @param checked - The new state of the element.
   * @param type - The type of the element.
   * @param wLine - The text for the element with a line.
   * @param woLine - The text for the element without a line.
   */
  toggleElement(
    id: string,
    checked: boolean,
    type: string,
    wLine?: string,
    woLine?: string
  ) {
    this.canvasService.unBindSelectionEvent();

    let found = 0;
    this.canvasService.getObjects().forEach((o) => {
      if (o.id === id) {
        this.canvasService.setActiveObject(o);
        found = 1;
      }
    });

    if (!found) {
      return;
    }

    const activeObject = this.canvasService.getActiveObject() as fabric.Object;

    /* Unchecked */
    if (!checked) {
      if (type === 'main') {
        this.canvasService.removeObject(activeObject);
      } else if (type === 'line') {
        activeObject._set('text', woLine);
      } else if (type === 'bold') {
        activeObject._set('fontWeight', 'normal');
      } else if (type === 'italic') {
        activeObject._set('fontStyle', 'normal');
      } else if (type === 'underline') {
        activeObject._set('underline', false);
      } else if (type === 'signature_mp') {
        for (const item of this.elements.static) {
          if (item.id === "static['signature']") {
            const withAuthSig = (item.sub_items as ICanvasSubItem[]).filter(
              (si) => {
                return si.name === 'With Authorized' && si.checked;
              }
            );

            const sigLine = withAuthSig.length
              ? '______________________\nAUTHORIZED SIGNATURE'
              : '______________________';
            activeObject._set('text', sigLine);
          }
        }
      } else if (type === 'signature_authorized') {
        for (const item of this.elements.static) {
          if (item.id === "static['signature']") {
            const withMpSig = (item.sub_items as ICanvasSubItem[]).filter(
              (si) => {
                return si.name === 'With MP' && si.checked;
              }
            );
            const sigLine = withMpSig.length
              ? '______________________MP'
              : '______________________';
            activeObject._set('text', sigLine);
          }
        }
      } else if (type === 'amount_box_main') {
        this.canvasService.removeObject(activeObject);
        this.amountBoxMainToggle(checked);
      }
    } else {
      /* Checked */
      if (id === "dynamic['bank_account_routing_no']") {
        activeObject.set({
          opacity: 1,
          hasBorders: true,
          hasControls: false,
          selectable: true,
          evented: true,
          lockMovementX: true,
          lockMovementY: true,
          left: 87,
          top: 246
        });
      } else {
        if (type === 'main') {
          this.canvasService.displayObject(activeObject);
        } else if (type === 'line') {
          activeObject._set('text', wLine);
        } else if (type === 'bold') {
          activeObject._set('fontWeight', 'bold');
        } else if (type === 'italic') {
          activeObject._set('fontStyle', 'italic');
        } else if (type === 'underline') {
          activeObject._set('underline', true);
        } else if (type === 'signature_mp') {
          for (const item of this.elements.static) {
            if (item.id === "static['signature']") {
              const withAuthSig = (item.sub_items as ICanvasSubItem[]).filter(
                (si) => {
                  return si.name === 'With Authorized' && si.checked;
                }
              );

              const sigLine = withAuthSig.length
                ? '______________________MP\nAUTHORIZED SIGNATURE'
                : '______________________MP';
              activeObject._set('text', sigLine);
            }
          }
        } else if (type === 'signature_authorized') {
          for (const item of this.elements.static) {
            if (item.id === "static['signature']") {
              const withMpSig = (item.sub_items as ICanvasSubItem[]).filter(
                (si) => {
                  return si.name === 'With MP' && si.checked;
                }
              );
              const sigLine = withMpSig.length
                ? '______________________MP\nAUTHORIZED SIGNATURE'
                : '______________________\nAUTHORIZED SIGNATURE';
              activeObject._set('text', sigLine);
            }
          }
        } else if (type === 'amount_box_main') {
          this.canvasService.displayObject(activeObject);
          this.amountBoxMainToggle(checked);
        }
      }
    }

    this.canvasService.renderAll();
    this.canvasService.bindSelectionEvent();
  }

  /**
   * @description Toggles the visibility of sub-items for a static element.
   * @param ele - The static element containing sub-items.
   */
  toggleSubItem(ele: ICanvasStaticElement) {
    if (ele.name === 'Check Number') {
      this.toggleElement(ele.id, !ele.checked, ele.type);
      ele.checked = !ele.checked;
      return;
    }
    ele.showSubItem = !ele.showSubItem;
  }

  /**
   * @description Toggles the visibility of the main amount box element.
   * @param checked - The new state of the main amount box.
   */
  amountBoxMainToggle(checked: boolean) {
    this.canvasService.getObjects().forEach((o) => {
      if (
        o.id === "static['amount_box_sign']" ||
        o.id === "static['amount_box_box']" ||
        o.id === "static['amount_box_line']"
      ) {
        this.canvasService.setActiveObject(o);

        !checked &&
          this.canvasService.removeObject(
            this.canvasService.getActiveObject() as fabric.Object
          );
        checked &&
          this.canvasService.displayObject(
            this.canvasService.getActiveObject() as fabric.Object
          );
      }
    });

    for (const item of this.elements.static) {
      if (item.id === "static['amount_box_sign']") {
        (item.sub_items as ICanvasSubItem[]).forEach((si) => {
          si.checked = checked;
        });
        break;
      }
    }
  }

  /**
   * @description Inserts Stub 1 to the check design canvas.
   * @param txt - The text variant indicator. If 2, adjusts the positioning for a specific layout.
   */
  stub1(txt: string | number) {
    let textOptions = {} as ITextOptions;
    this.canvasService.saveHistoryOff();

    textOptions = {
      id: "dynamic['date']",
      left: 30,
      top: 300,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold'
    };
    if (txt === 2) {
      textOptions.top = 590;
    }

    this.canvasService.addText(this.getDate(), textOptions, true);

    textOptions = {
      id: "dynamic['payto_name']",
      left: 200,
      top: 300,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold'
    };
    if (txt == 2) {
      textOptions.top = 590;
    }
    this.canvasService.addText('<Pay to Name>', textOptions, true);

    textOptions = {
      id: "dynamic['check_no']",
      left: 569,
      top: 300,
      fontSize: 12,
      fontFamily: 'Helvetica',
      fontWeight: 'bold'
    };
    if (txt == 2) {
      textOptions.top = 590;
    }
    this.canvasService.addText('<Check No>', textOptions, true);

    textOptions = {
      id: "static['other']",
      left: 200,
      top: 320,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 610;
    }
    this.canvasService.addText('Pay To: ', textOptions, true);

    textOptions = {
      id: "dynamic['payto_name']",
      left: 300,
      top: 320,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 610;
    }
    this.canvasService.addText('<Pay to Name>', textOptions, true);

    textOptions = {
      id: "dynamic['payto_address_2line']",
      left: 300,
      top: 335,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 625;
    }
    this.canvasService.addText(
      '<Pay to Address>\n<City, ST, ZIP>',
      textOptions,
      true
    );

    textOptions = {
      id: "static['other']",
      left: 200,
      top: 390,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 680;
    }
    this.canvasService.addText('Pay From: ', textOptions, true);

    textOptions = {
      id: "dynamic['business_name']",
      left: 300,
      top: 390,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 680;
    }
    this.canvasService.addText(this.data.bankAccountName, textOptions, true);

    textOptions = {
      id: "dynamic['business_address']",
      left: 300,
      top: 405,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 695;
    }
    this.canvasService.addText(
      this.data.bankAccountAddress?.toString().replace(/\\n/g, '\n').trim(),
      textOptions,
      true
    );

    textOptions = {
      id: "dynamic['payto_account_no']",
      left: 200,
      top: 460,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 750;
    }
    this.canvasService.addText('<Account No>', textOptions, true);

    textOptions = {
      id: "dynamic['payto_invoice_no']",
      left: 200,
      top: 480,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 770;
    }
    this.canvasService.addText('<Invoice No>', textOptions, true);

    textOptions = {
      id: "static['other']",
      left: 30,
      top: 510,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 800;
    }
    this.canvasService.addText('MEMO ', textOptions, true);

    textOptions = {
      id: "dynamic['memo']",
      left: 70,
      top: 510,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt == 2) {
      textOptions.top = 800;
    }
    this.canvasService.addText('<Memo>', textOptions, true);

    textOptions = {
      id: "dynamic['note']",
      left: 150,
      top: 510,
      fontSize: 11,
      fontFamily: 'Helvetica'
    };
    if (txt === 2) {
      textOptions.top = 800;
    }
    this.canvasService.addText('<Note>', textOptions, true);


    textOptions = {
      id: "dynamic['business_name']",
      left: 30,
      top: 530,
      fontSize: 12,
      fontFamily: 'Helvetica',
      fontWeight: 'bold'
    };
    if (txt == 2) {
      textOptions.top = 820;
    }
    this.canvasService.addText('bankaccount_name', textOptions, true);

    textOptions = {
      id: "dynamic['amount_digit']",
      left: 569,
      top: 530,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold'
    };
    if (txt == 2) {
      textOptions.top = 820;
    }
    this.canvasService.addText('<000.00>', textOptions, true);

    this.canvasService.saveHistory();
    this.canvasService.saveHistoryOn();
  }

  // Remittance Stub
  remittanceStub() {
    this.canvasService.saveHistoryOff();

    let textOptions: ITextOptions = {
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold'
    };

    this.elements.dynamicRemittance.forEach((e) => {
      if (e.txt === 'currentDate') {
        e.txt = this.datePipe.transform(new Date(), 'MM/dd/YYYY')!;
      }
      textOptions = { ...textOptions, ...e.pos, id: `dynamic['${e.type}']` };
      this.canvasService.addText(e.txt, textOptions, true);
    });

    this.canvasService.saveHistory();
    this.canvasService.saveHistoryOn();
  }

  /**
   * @description Returns the current date in MM/dd/YYYY format.
   * @returns The current date.
   */
  getDate(): string {
    return this.datePipe.transform(new Date(), 'MM/dd/YYYY') as string;
  }

  /**
   * @description Checks if the given event key code corresponds to a number.
   * @param evt - The keyboard event.
   * @returns True if the key code represents a number, false otherwise.
   */
  isNumber(evt: KeyboardEvent) {
    const event = evt ? evt : window.event;
    const charCode =
      (event as KeyboardEvent)?.which ?? (event as KeyboardEvent)?.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Removes the 'skelton' class from loaded elements.
   */
  removeLoadedSkelton() {
    const main_common_module: NodeListOf<HTMLElement> =
      document.querySelectorAll('.menu_content .skelton')!;
    main_common_module.forEach((item) => item.classList.remove('skelton'));
  }

  /**
   * Adds a custom design element.
   */
  addCustomElement() {
    // if (!this.customElementRestriction.enable_custom_elements) {
    //   this.alertService.warningAlert({ content: 'To enable this feature, please contact customer support', doneMsg: "Contact now", cancelMsg: "Cancel",isCancel:true }).afterClosed()
    //     .subscribe(result => {
    //       if (result) {
    //         const newTab = window.open();
    //         newTab!.opener = null;
    //         newTab!.location=this.customerSupportUrl;
    //       }
    //     });
    //   return;
    // }
    if (
      this.elements.custom?.length >=
      this.customElementRestriction.custom_elements_limit
    ) {
      this.alertService
        .warningAlert({
          content:
            'Custom elements limit exceeded, please contact customer support to increase the limit',
          doneMsg: 'Contact now',
          cancelMsg: 'Not Now',
          isCancel: true
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const newTab = window.open();
            newTab!.opener = null;
            newTab!.location = this.customerSupportUrl;
          }
        });
      return;
    }
    const dialogRef = this.dialog.open(AddCustomElementComponent, {
      maxWidth: '500px',
      width: '100%',
      data: {
        id: this.data.bankAccountId,
        edit: { element: '' }
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      this.toggleCustomElement(data, true);

      this.checkDesignService
        .getCustomElements()
        .subscribe((res: IApiRes<ICustomData>) => {
          if (res.success) {
            const newElement = res.data.custom_elements.find(
              (item) => item.custom_element === data
            );
            this.elements.custom.push({
              id: newElement?.id as number,
              element: newElement?.custom_element as string,
              checked: true
            });
            this.alertService.successAlert({
              content: 'Custom element added sucessfully'
            });
          }
        });
    });
  }

  /**
   * Edits a custom design element.
   * @param ele - The custom element to be edited.
   */
  editCustomElement(ele: { id: number; element: string; checked: boolean }) {
    const elementToEdit = ele.element;
    const dialogRef = this.dialog.open(AddCustomElementComponent, {
      maxWidth: '500px',
      width: '100%',
      data: {
        id: this.data.bankAccountId,
        edit: ele
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      Object.assign(
        this.elements.custom.find(
          (obj) => obj.id === res.id
        ) as IElements['custom'][number],
        res
      );

      this.canvasService.unBindSelectionEvent();
      this.canvasService.getObjects().forEach((o) => {
        if (o.id === `custom['${elementToEdit}']`) {
          this.canvasService.setActiveObject(o);
        }
      });
      const activeObject = this.canvasService.getActiveObject();

      if (ele.checked) {
        this.canvasService.removeCustomElement(activeObject);

        const fontStyle: 'normal' | 'italic' =
          this.fontStyle.italic === 'italic' ? 'italic' : 'normal';
        const options = {
          id: `custom['${res.element}']`,
          left: 375,
          top: 75,
          fontSize: this.selectedFontSize,
          fontFamily: this.selectedFontFamily,
          fill: this.colorPicker,
          fontWeight: this.fontStyle.fontWeight,
          fontStyle,
          underline: this.fontStyle.underline,
          textAlign: this.textAlign
        };
        this.canvasService.addIText(res.element, options);
      }
      this.canvasService.renderAll();
      this.canvasService.bindSelectionEvent();
      this.alertService.successAlert({
        content: 'Custom element updated sucessfully'
      });
    });
  }

  /**
   * Deletes a custom design element.
   * @param ele - The custom element to be deleted.
   */
  deleteCustomElement(ele: { id: number; element: string }) {
    this.alertService
      .confirmAlert({
        content: `Are you sure you want to delete "${ele.element}"?`
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.canvasService.unBindSelectionEvent();
          this.canvasService.getObjects().forEach((o) => {
            if (o.id === `custom['${ele.element}']`) {
              this.canvasService.setActiveObject(o);
            }
          });
          const activeObject = this.canvasService.getActiveObject();
          this.canvasService.removeCustomElement(activeObject);
          this.canvasService.renderAll();
          this.canvasService.bindSelectionEvent();

          this.checkDesignService.deleteCustomElement(ele.id).subscribe(() => {
            this.checkDesignService
              .getCustomElements()
              .subscribe((res: IApiRes<ICustomData>) => {
                this.elements.custom = res.data.custom_elements.map(
                  (item: { id: number; custom_element: string }) => {
                    return {
                      id: item.id,
                      element: item.custom_element,
                      checked: this.designElements.includes(item.custom_element)
                        ? true
                        : false
                    };
                  }
                );
                this.alertService.successAlert({
                  content: 'Custom element deleted sucessfully'
                });
              });
          });
        }
      });
  }

  /**
   * Toggles the visibility of a custom design element.
   * @param customElementText - The text of the custom element.
   * @param checked - The new state of the custom element.
   */
  toggleCustomElement(customElementText: string, checked: boolean) {
    this.canvasService.unBindSelectionEvent();
    this.canvasService.getObjects().forEach((o) => {
      if (o.id === `dynamic['${customElementText}']`) {
        this.canvasService.setActiveObject(o);
      }
    });
    const activeObject = this.canvasService.getActiveObject();

    if (!checked) {
      this.canvasService.removeCustomElement(activeObject);
    } else {
      const fontStyle: 'normal' | 'italic' =
        this.fontStyle.italic === 'italic' ? 'italic' : 'normal';
      const options = {
        id: `dynamic['${customElementText}']`,
        left: 375,
        top: 75,
        fontSize: this.selectedFontSize,
        fontFamily: this.selectedFontFamily,
        fill: this.colorPicker,
        fontWeight: this.fontStyle.fontWeight,
        fontStyle,
        underline: this.fontStyle.underline,
        textAlign: this.textAlign
      };
      this.canvasService.addIText(customElementText, options);
    }

    this.canvasService.renderAll();
    this.canvasService.bindSelectionEvent();
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el?.unsubscribe());
  }
}

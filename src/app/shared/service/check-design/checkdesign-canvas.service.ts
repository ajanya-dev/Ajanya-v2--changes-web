import { StaticCanvas } from 'fabric/fabric-impl';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { fabric } from 'fabric';
import {
  IObjectOptions,
  ICheckDesignObjects,
  ICheckDesignData
} from 'src/app/models/check-design';

export interface IActiveMenu {
  name: string;
  mode: string;
  activeObject?: ICheckDesignObjects;
  textEdit?: boolean;
}

type TGetCavasData = Omit<ReturnType<StaticCanvas['toJSON']>, 'objects'> & {
  background: string;
  objects: ICheckDesignObjects[];
};

@Injectable()
export class CheckdesignCanvasService {
  public canvas: fabric.Canvas;
  objectClipboard: any;
  selectionIsActive = false;
  justSavedDesign = true;
  bankVariables: ICheckDesignData = {} as ICheckDesignData;
  initialBackgroundMeta?: {
    naturalWidth: number;
    naturalHeight: number;
  } = undefined;

  private activeMenu = new BehaviorSubject<IActiveMenu>({
    name: 'menu-elements',
    mode: 'new'
  });
  activeMenu$ = this.activeMenu.asObservable();

  canvasHistory: any = { undoList: [], redoList: [] };
  bgImagePath = 'assets/images/check_bg.png';
  bgColor = '#EDF8FD';
  dynamicEditable = [
    "dynamic['business_name']",
    "dynamic['business_address']",
    "dynamic['bank_name']"
  ];

  private canvasLoading = new BehaviorSubject<boolean>(true);
  canvasLoading$ = this.canvasLoading.asObservable();

  getObjects() {
    return this.canvas.getObjects() as ICheckDesignObjects[];
  }

  initEditCheckCanvas(data: any): void {
    this.unBindSelectionEvent();
    this.saveHistoryOff();
    this.removeNullText(data);
    this.canvas.loadFromJSON(data, () => {
      setTimeout(() => {
        this.routingBoxFix();
        this.protectRoutingNumberBoxes();
        this.canvas.backgroundColor = this.bgColor;
        this.addGridImage();
        this.addGrid();
        this.renderAll();
        this.bindSelectionEvent();
        this.canvasLoading.next(false);
      }, 1000);
    });
  }

  //bug fix to null text in object causing blank screen and throws error in fabric.js
  removeNullText(data: any): void {
    if (data?.objects?.length > 0) {
      data.objects.forEach((obj: any) => {
        if (obj?.text == null) {
          obj.text = '';
        }
      });
    }
  }
  //bug fix end

  routingBoxFix(): void {
    this.getObjects().forEach((ele: any) => {
      if (ele.id === "dynamic['bank_account_routing_no']") {
        ele.set({ width: 500 });
        this.renderAll();
      }
    });
  }

  /**
   * Protects routing number box objects from selection and rotation
   */
  protectRoutingNumberBoxes(): void {
    this.getObjects().forEach((obj: ICheckDesignObjects) => {
      if (this.isRoutingNumberBox(obj)) {
        obj.set({
          selectable: false,
          evented: false,
          lockRotation: true,
          hasRotatingPoint: false,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockUniScaling: true
        });
      }
    });
  }

  private isRoutingNumber(obj: {id: string}): boolean {
    return obj.id === 'bank_account_routing_no' || 
           (!!obj.id && obj.id.includes('bank_account_routing_no'));
  }

  /**
   * Checks if an object is a routing number box that should be protected
   */
  private isRoutingNumberBox(obj: {id: string}): boolean {    
    return obj.id === 'routing_number_box' || 
           (!!obj.id && obj.id.includes('routing_number_box'));
  }

  /**
   * Checks if an object is protected (routing number box)
   */
  isObjectProtected(obj: {id: string}): boolean {
    return this.isRoutingNumberBox(obj);
  }

  addGridImage(): void {
    const shapeOptions: any = {
      left: 0,
      top: 0,
      opacity: 1,
      selectable: false,
      id: 'grid_image'
    };
    const newImg = new Image();
    newImg.onload = () => {
      const logoObject = new fabric.Image(newImg, shapeOptions);
      logoObject.type = 'image';
      this.canvas.add(logoObject);
      this.canvas.sendToBack(logoObject);

      this.saveHistoryOn();
      this.saveHistory(); // call after image added
    };
    newImg.crossOrigin = 'anonymous';
    newImg.src = this.bgImagePath;
  }

  //=================> Utils ===============//

  addGrid(): void {
    const stroke = '#CBD6DB';
    const grid = 12;
    const canvasWidth = 675;
    const canvasHeight = 875;
    const lineOption: any = {
      type: 'line',
      stroke,
      selectable: false,
      opacity: 0,
      id: 'grid_line'
    };

    for (let i = 0; i < canvasWidth / grid; i++) {
      const line = new fabric.Line(
        [i * grid, 0, i * grid, canvasHeight],
        lineOption
      );
      this.canvas.add(line);
      this.canvas.sendToBack(line);
    }

    for (let i = 0; i < canvasHeight / grid; i++) {
      const line = new fabric.Line(
        [0, i * grid, canvasWidth, i * grid],
        lineOption
      );
      this.canvas.add(line);
      this.canvas.sendToBack(line);
    }
  }

  setActiveObject(object: fabric.Object): void {
    this.canvas.setActiveObject(object);
  }

  getActiveObject() {
    return this.canvas.getActiveObject() as ICheckDesignObjects;
  }

  addText(text: string, textOptions: fabric.ITextOptions, stub = false): void {
    const textObj = new fabric.IText(text, textOptions);
    this.canvas.add(textObj);
    if (!stub) {
      this.canvas.setActiveObject(textObj);
    }
  }

  /**
   * Add Interactive text
   */
  addIText(text: string, options?: fabric.ITextOptions): void {
    this.canvas.add(new fabric.IText(text, options));
  }

  addImage(imgSrc: string, imageId = 'newId', shapeOptions?: any): void {
    const newImg = new Image();
    shapeOptions = shapeOptions ? shapeOptions : this.objectProperties(imageId);

    newImg.onload = () => {
      const logoObject = new fabric.Image(newImg, shapeOptions);
      logoObject.type = 'image';
      logoObject.scaleToHeight(
        shapeOptions?.id === 'user_signature' ? 150 : 80
      );
      logoObject.scaleToWidth(shapeOptions?.id === 'user_signature' ? 150 : 80);
      this.canvas.add(logoObject);
      this.renderAll();
      this.canvas.setActiveObject(logoObject);
    };
    newImg.crossOrigin = 'anonymous';
    newImg.src = imgSrc;
  }

  addDataUrl(dataUrl: string, shapeOptions?: any): void {
    shapeOptions = shapeOptions
      ? shapeOptions
      : this.objectProperties('data-url-image');
    shapeOptions.id = shapeOptions.id ? shapeOptions.id : 'data-url-image';
    fabric.Image.fromURL(dataUrl, (img) => {
      img.scaleToHeight(80);
      img.scaleToWidth(80);
      img.crossOrigin = 'anonymous';
      img.set(shapeOptions);
      this.canvas.add(img);
      this.canvas.setActiveObject(img);
    });
  }

  changeOpacity(object: fabric.Object, opacity: number): void {
    if (object) {
      object.set({ opacity: opacity / 100 });
      this.renderAll();
    }
  }

  removeObject(object: fabric.Object): void {
    object.set({
      opacity: 0,
      hasBorders: false,
      hasControls: false,
      selectable: false,
      evented: false
    });
  }

  displayObject(object: fabric.Object): void {
    object.set({
      opacity: 1,
      hasBorders: true,
      hasControls: true,
      selectable: true,
      evented: true
    });
  }

  renderAll(): void {
    // Ensure routing number boxes are protected before rendering
    this.protectRoutingNumberBoxes();
    this.canvas.renderAll();
  }

  getCanvasData(): TGetCavasData {
    return this.canvas.toJSON([
      'id',
      'cornerStyle',
      'transparentCorners',
      'cornerColor',
      'borderColor',
      'cornerSize',
      'padding',
      'borderDashArray',
      'rotatingPointOffset',
      'hasBorders',
      'hasControls',
      'selectable',
      'evented',
      'lockRotation',
      'hasRotatingPoint',
      'lockMovementX',
      'lockMovementY',
      'showTextBoxBorder',
      'textboxBorderColor',
      'wrapWidth'
    ]) as ReturnType<StaticCanvas['toJSON']> & {
      background: string;
      objects: ICheckDesignObjects[];
    };
  }

  objectProperties(
    newid = 'newid',
    newleft = 50,
    newtop = 50,
    hidden = '',
    rotation = ''
  ) {
    const common_values: IObjectOptions = {
      id: newid,
      left: newleft,
      top: newtop,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fill: '#000',
      originX: 'left',
      originY: 'top',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerColor: 'orange',
      borderColor: 'orange',
      cornerSize: 14,
      padding: 4,
      borderDashArray: [6, 6],
      rotatingPointOffset: 25
    };
   
    if (hidden === 'hide') {
      common_values.opacity = 0;
      common_values.hasBorders = false;
      common_values.hasControls = false;
      common_values.selectable = false;
      common_values.evented = false;
    }
    if (rotation === 'norotate') {
      common_values.lockRotation = false;
      common_values.hasRotatingPoint = false;
    }
    return common_values;
  }

  isObjectActive(): any {
    return this.canvas.getActiveObject() ? true : false;
  }

  deleteBackground(): void {
    this.canvas.backgroundImage = '';
    this.canvas.backgroundColor = '#FFFFFF';
    this.saveHistory();
    this.renderAll();
  }

  //=================> right menu actions ===============//

  previewDesign(): void {
    this.canvas.backgroundColor = '#FFFFFF';

    this.canvas.getObjects().forEach((o: any) => {
      if (
        (o.id === 'grid_image' && o.opacity == 1) ||
        (o.id === 'grid_line' && o.opacity === 1)
      ) {
        o.opacity = 0;
      }
    });

    this.renderAll();

    const imgPdfData = this.canvas.toDataURL({
      format: 'png',
      multiplier: 3
    });

    const checkPrevRef = <HTMLImageElement>(
      document.getElementById('check_preview_image')
    );
    checkPrevRef.src = imgPdfData;
  }

  closePreview(): void {
    this.canvas.getObjects().forEach((o: any) => {
      if (o.id === 'grid_image' && o.opacity == 0) {
        o.opacity = 1;
      }
    });

    this.canvas.backgroundColor = this.bgColor;
    this.renderAll();
  }

  toggleGridLine(): void {
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj.id === 'grid_line') {
        if (obj.opacity === 0) {
          obj.opacity = 1;
        } else {
          obj.opacity = 0;
        }
      }
    });

    this.renderAll();
  }

  copyObject(): boolean {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone(
        (cloned: any) => {
          this.objectClipboard = cloned;
        },
        ['id']
      );

      return true;
    }

    return false;
  }

  pasteObject(): void {
    this.canvas.discardActiveObject();
    this.objectClipboard.clone((clonedObj: any) => {
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        originX: 'left',
        originY: 'top',
        id: this.objectClipboard.id || 'newid',
        cornerStyle: 'rect',
        transparentCorners: false,
        cornerColor: 'orange',
        borderColor: 'orange',
        cornerSize: 10,
        padding: 4,
        borderDashArray: [6, 6],
        rotatingPointOffset: 15,
        hasBorders: true,
        hasControls: true,
        selectable: true,
        evented: true
      });

      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = this.canvas;
        clonedObj.forEachObject((obj: any) => {
          obj.set({
            left: obj.left + 10,
            top: obj.top + 10,
            originX: 'left',
            originY: 'top',
            id: this.objectClipboard.id || 'newid',
            cornerStyle: 'rect',
            transparentCorners: false,
            cornerColor: 'orange',
            borderColor: 'orange',
            cornerSize: 10,
            padding: 4,
            borderDashArray: [6, 6],
            rotatingPointOffset: 15,
            hasBorders: true,
            hasControls: true,
            selectable: true,
            evented: true
          });
          this.canvas.add(obj);
        });
        clonedObj.setCoords();
      } else {
        this.canvas.add(clonedObj);
      }
      
      // Protect routing number boxes after adding objects
      this.protectRoutingNumberBoxes();

      clonedObj.top += 10;
      clonedObj.left += 10;
      this.canvas.setActiveObject(clonedObj);
      this.canvas.requestRenderAll();
    });
  }

  deleteObject(): void {
    const activeObjects = this.canvas.getActiveObjects();
    activeObjects.forEach((activeObject: any) => {
      // Prevent deletion of protected routing number boxes
      if (this.isRoutingNumberBox(activeObject)) {
        return;
      }
      
      if (activeObject.id == "static['other']") {
        this.canvas.remove(activeObject);
        return;
      }

      if (
        (activeObject.id && activeObject.id?.indexOf('static') >= 0) ||
        activeObject.id === "dynamic['bank_account_routing_no']"
      ) {
        this.removeObject(activeObject);
        this.canvas.moveTo(activeObject, 0);
        if (activeObject.id === "dynamic['bank_account_routing_no']") {
          this.setActiveMenu({ name: 'menu-elements' });
        }
        return;
      }

      this.canvas.remove(activeObject);
    });
  }

  rotateObject(): void {
    const activeObjects: any = this.canvas.getActiveObjects();
    activeObjects.forEach((activeObject: any) => {
      // Prevent rotation of protected routing number boxes
      if (this.isRoutingNumberBox(activeObject)) {
        return;
      }
      
      const new_angle = (activeObject.angle += 90);
      activeObject.set({
        centeredRotation: true,
        angle: new_angle
      });
    });
    this.canvas.renderAll();
  }

  moveObjects(direction: string): void {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects) {
      activeObjects.forEach((activeObject: any) => {
        // Prevent moving protected routing number boxes
        if (this.isRoutingNumberBox(activeObject) || activeObject.id?.indexOf('routing_n') > 0) {
          return;
        }
        switch (direction) {
          case 'left':
            activeObject.left -= 1;
            break;
          case 'right':
            activeObject.left += 1;
            break;
          case 'up':
            activeObject.top -= 1;
            break;
          case 'down':
            activeObject.top += 1;
            break;
        }
      });
    }
    this.canvas.renderAll();
    this.canvas.calcOffset();
  }

  saveHistory(): void {
    const maxSize = 10;
    const properties = [
      'id',
      'cornerStyle',
      'transparentCorners',
      'cornerColor',
      'borderColor',
      'cornerSize',
      'padding',
      'borderDashArray',
      'rotatingPointOffset',
      'hasBorders',
      'hasControls',
      'selectable',
      'evented',
      'lockRotation',
      'hasRotatingPoint',
      'lockMovementX',
      'lockMovementY'
    ];
    const obj = this.canvas.toJSON(properties);

    if (this.canvasHistory.undoList.length < maxSize) {
      this.canvasHistory.undoList.push(obj);
    } else {
      this.canvasHistory.undoList.shift();
      this.canvasHistory.undoList.push(obj);
    }
    this.justSavedDesign = false;
  }

  saveHistoryOn(): void {
    this.canvas.on('object:moving', (e) => {
      // Prevent routing number boxes from being moved
      const movingObject = e.target as ICheckDesignObjects;      
      if (movingObject && this.isRoutingNumberBox(movingObject)) {
        // Stop the movement
        e.e.preventDefault();
        e.e.stopPropagation();
      }
    });

    this.canvas.on('object:modified', (e) => {
      // Prevent routing number boxes from being modified/moved
      const modifiedObject = e.target as ICheckDesignObjects;      
      if (modifiedObject && this.isRoutingNumberBox(modifiedObject)) {
        // Revert the modification by restoring the original position
        this.protectRoutingNumberBoxes();
        this.canvas.requestRenderAll();
        return;
      }
      
      this.saveHistory();
      this.canvasHistory.redoList = [];
    });

    this.canvas.on('object:added', () => {
      this.saveHistory();
      this.canvasHistory.redoList = [];
    });

    this.canvas.on('object:removed', () => {
      this.saveHistory();
      this.canvasHistory.redoList = [];
    });
  }

  saveHistoryOff(): void {
    this.canvas.off('object:modified');
    this.canvas.off('object:added');
    this.canvas.off('object:removed');
  }

  undoAction(): void {
    if (this.canvasHistory.undoList.length <= 1) {
      return;
    }
    this.saveHistoryOff();

    const currentState = this.canvasHistory.undoList.pop();
    this.canvasHistory.redoList.push(currentState);
    const prevState =
      this.canvasHistory.undoList[this.canvasHistory.undoList.length - 1];
    this.canvas.loadFromJSON(prevState, () => {
      this.canvas.renderAll();
      this.saveHistoryOn();
      this.routingBoxFix();
    });
  }

  redoAction(): void {
    if (!this.canvasHistory.redoList.length) {
      return;
    }
    this.saveHistoryOff();

    const prevState = this.canvasHistory.redoList.pop();
    this.canvasHistory.undoList.push(prevState);
    this.canvas.loadFromJSON(prevState, () => {
      this.canvas.renderAll();
      this.saveHistoryOn();
      this.routingBoxFix();
    });
  }
  //=================> right menu actions end ===============//

  //=================> settings start ===============//

  bindSelectionEvent(): void {
    this.canvas.on('selection:created', () => {
      // Check if selected object is a protected routing number box
      const activeObject = this.canvas.getActiveObject() as any;
      if (activeObject && this.isRoutingNumberBox(activeObject)) {
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
        return;
      }
      
      // Check if group selection contains routing number boxes
      if (activeObject && activeObject.type === 'activeSelection') {        
        const hasRoutingNumberBox = activeObject.getObjects().some((obj: any) => this.isRoutingNumber(obj));        
        if (hasRoutingNumberBox) {
          // Remove routing number boxes from the selection
          const objectsToRemove = activeObject.getObjects().filter((obj: any) => this.isRoutingNumber(obj));
          objectsToRemove.forEach((obj: any) => {
            activeObject.removeWithUpdate(obj);
          });
          
          // If no objects left in selection, discard it
          if (activeObject.getObjects().length === 0) {
            this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();
            return;
          }
        }
      }
      
      this.selectionIsActive = true;
      this.openSettings();
    });

    this.canvas.on('selection:updated', () => {
      // Check if selected object is a protected routing number box
      const activeObject = this.canvas.getActiveObject() as any;
      if (activeObject && this.isRoutingNumberBox(activeObject)) {
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
        return;
      }
      
      // Check if group selection contains routing number boxes
      if (activeObject && activeObject.type === 'activeSelection') {
        const hasRoutingNumberBox = activeObject.getObjects().some((obj: any) => this.isRoutingNumberBox(obj));
        if (hasRoutingNumberBox) {
          // Remove routing number boxes from the selection
          const objectsToRemove = activeObject.getObjects().filter((obj: any) => this.isRoutingNumberBox(obj));
          objectsToRemove.forEach((obj: any) => {
            activeObject.removeWithUpdate(obj);
          });
          
          // If no objects left in selection, discard it
          if (activeObject.getObjects().length === 0) {
            this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();
            return;
          }
        }
      }
      
      this.selectionIsActive = true;
      this.openSettings();
    });

    this.canvas.on('selection:cleared', () => {
      this.selectionIsActive = false;
      this.clearSettings();
    });
  }

  unBindSelectionEvent(): void {
    if (this.canvas) {
      this.canvas.off('selection:created');
      this.canvas.off('selection:updated');
    }
  }

  openSettings(): void {
    const activeObject: any = this.getActiveObject();

    if (activeObject.type === 'text' || activeObject.type === 'i-text') {
      if (activeObject.id === "dynamic['bank_account_routing_no']") {
        this.setActiveMenu({
          name: 'menu-text',
          mode: 'routing_no',
          activeObject
        });
      } else if (
        activeObject.id?.includes('dynamic') &&
        !this.dynamicEditable.includes(activeObject.id)
      ) {
        this.setActiveMenu({
          name: 'menu-text',
          mode: 'edit',
          activeObject,
          textEdit: false
        });
      } else {
        this.setActiveMenu({ name: 'menu-text', mode: 'edit', activeObject });
      }
    } else if (activeObject.type === 'image') {
      this.setActiveMenu({ name: 'edit-image', mode: 'edit', activeObject });
    } else if (activeObject.ctype === 'shape') {
      this.setActiveMenu({ name: 'menu-shapes', mode: 'edit', activeObject });
    }
  }

  clearSettings(): void {
    this.setActiveMenu({ name: this.activeMenu.value.name, mode: 'new' });
  }

  setActiveMenu(menu: any): void {
    if (!menu?.mode) {
      menu.mode = 'new';
    }
    this.activeMenu.next(menu);
  }

  //=================> settings end ===============> //

  updateUrl(event: any): void {
    event.target.src = 'assets/images/error-image-generic.png';
  }

  isNumber(evt: any): boolean {
    evt = evt ? evt : window.event;
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * The function `getImageNaturalSize` returns a promise that resolves with the natural width and
   * height of an image given its URL.
   * @param {string} url - The URL of the image for which you want to get the natural size.
   * @returns a Promise that resolves to an object with properties `naturalWidth` and `naturalHeight`.
   */
  getImageNaturalSize(
    url: string
  ): Promise<{ naturalWidth: number; naturalHeight: number }> {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.onload = function () {
        resolve({
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      };
      img.src = url;
    });
  }

  /**
   * remove custom element
   */
  removeCustomElement(activeObject: any) {
    this.canvas.remove(activeObject);
  }
}

import { Component, OnInit } from '@angular/core';
import { fabric } from 'fabric';
import { EditCheckDesignService } from 'src/app/shared/service/check-design/check-design-data.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { NgClass, NgStyle, AsyncPipe } from '@angular/common';

/**
 * @description component responsible for managing the check design canvas.
 */
@Component({
  selector: 'app-checkdesign-canvas',
  templateUrl: './checkdesign-canvas.component.html',
  styleUrls: ['./checkdesign-canvas.component.scss'],
  standalone: true,
  imports: [NgClass, NgStyle, AsyncPipe]
})
export class CheckdesignCanvasComponent implements OnInit {
  canvas: fabric.Canvas;

  constructor(
    public checkDesignData: EditCheckDesignService,
    public canvasService: CheckdesignCanvasService
  ) {}

  ngOnInit(): void {
    this.canvas = new fabric.Canvas('canvas');
    this.canvasService.canvas = this.canvas;
    this.canvas.hoverCursor = 'pointer';
    this.customizeFabric();
    
    // Set up protection for routing number boxes
    this.setupRoutingNumberBoxProtection();
  }

  /**
   * @description Initializes and customizes the Fabric.js library.
   */
  customizeFabric() {
    this.selectObjectStyle();
    this.cornerStyles();
    fabric.Text.prototype.cacheProperties =
      fabric.Text.prototype.cacheProperties?.concat('active');
  }

  /**
   * @description Configures the style for selected objects in the canvas.
   */
  selectObjectStyle() {
    fabric.Object.prototype.set({
      originX: 'left',
      originY: 'top',
      fill: '#000',
      strokeWidth: 1,
      strokeLineCap: 'butt',
      strokeDashOffset: 0,
      strokeLineJoin: 'miter',
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: undefined,
      visible: true,
      backgroundColor: '',
      fillRule: 'nonzero',
      paintFirst: 'fill',
      globalCompositeOperation: 'source-over',
      skewX: 0,
      skewY: 0,
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerColor: 'orange',
      borderColor: 'orange',
      cornerSize: 10,
      padding: 4,
      borderDashArray: [6, 6],
      rotatingPointOffset: 25,
      hasBorders: true,
      hasControls: true,
      selectable: true,
      evented: true,
      lockRotation: false,
      hasRotatingPoint: true,
      lockMovementX: false,
      lockMovementY: false
    });
  }

  /**
   * @description Configures the corner styles for controls on objects in the canvas.
   * This style used when an object is selected
   */
  cornerStyles() {
    const size = 19;
    const deleteIcon =
      "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
    const rotateIcon =
      "data:image/svg+xml;charset=UTF-8,%3csvg aria-hidden='true' focusable='false' data-prefix='far' data-icon='undo' class='svg-inline--fa fa-undo fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3e%3cpath fill='currentColor' d='M12 8h27.711c6.739 0 12.157 5.548 11.997 12.286l-2.347 98.568C93.925 51.834 170.212 7.73 256.793 8.001 393.18 8.428 504.213 120.009 504 256.396 503.786 393.181 392.835 504 256 504c-63.926 0-122.202-24.187-166.178-63.908-5.113-4.618-5.354-12.561-.482-17.433l19.738-19.738c4.498-4.498 11.753-4.785 16.501-.552C160.213 433.246 205.895 452 256 452c108.322 0 196-87.662 196-196 0-108.322-87.662-196-196-196-79.545 0-147.941 47.282-178.675 115.302l126.389-3.009c6.737-.16 12.286 5.257 12.286 11.997V212c0 6.627-5.373 12-12 12H12c-6.627 0-12-5.373-12-12V20C0 13.373 5.373 8 12 8z'%3e%3c/path%3e%3c/svg%3e";

    const deleteImg = document.createElement('img');
    const rotateImg = document.createElement('img');
    deleteImg.src = deleteIcon;
    rotateImg.src = rotateIcon;

    fabric.Object.prototype.controls.tr = new fabric.Control({
      x: 0.5,
      y: -0.58,
      cursorStyle: 'pointer',
      mouseUpHandler: deleteObject,
      render: renderDelImg
    });

    fabric.Object.prototype.controls.mtr.render = renderRotImg;

    /**
     * Deletes an object from the canvas.
     * @param eventData - Mouse event data.
     * @param transform - Transformation data.
     * @returns `true` if the object is deleted successfully.
     */
    function deleteObject(eventData: MouseEvent, transform: fabric.Transform) {
      const target = transform.target as fabric.Object & { id: string };
      const canvas = target.canvas;
      const id = target?.id;

      if (id?.indexOf('static') >= 0 && id !== "static['other']") {
        removeObject(target);
        canvas?.moveTo(target, 0);
      } else {
        canvas?.remove(target);
      }
      canvas?.requestRenderAll();
      return true;
    }

    /**
     * Renders the delete icon on the canvas.
     * @param ctx - Canvas rendering context.
     * @param left - X-coordinate.
     * @param top - Y-coordinate.
     * @param _ - Unused parameter.
     * @param fabricObject - Fabric object with angle property.
     */
    function renderDelImg(
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      _: unknown,
      fabricObject: fabric.Object & { angle: number }
    ) {
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
      ctx.drawImage(deleteImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    /**
     * Renders the rotate icon on the canvas.
     * @param ctx - Canvas rendering context.
     * @param left - X-coordinate.
     * @param top - Y-coordinate.
     * @param _ - Unused parameter.
     * @param fabricObject - Fabric object with angle property.
     */
    function renderRotImg(
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      _: unknown,
      fabricObject: fabric.Object & { angle: number }
    ) {
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
      ctx.drawImage(rotateImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    /**
     * Removes an object from the canvas.
     * @param object - Fabric object to be removed.
     */
    function removeObject(object: fabric.Object) {
      object.set({
        opacity: 0,
        hasBorders: false,
        hasControls: false,
        selectable: false,
        evented: false
      });
    }
  }

  /**
   * @description Sets up protection for routing number box objects
   */
  private setupRoutingNumberBoxProtection(): void {
    // Add event listener to protect routing number boxes when objects are added
    this.canvas.on('object:added', () => {
      setTimeout(() => {
        this.canvasService.protectRoutingNumberBoxes();
      }, 100);
    });

    // Prevent mouse events on protected objects
    this.canvas.on('mouse:down', (e) => {
      if (e.target && this.canvasService.isObjectProtected(e.target as unknown as {id: string})) {
        e.e.stopPropagation();
      }
    });

    this.canvas.on('mouse:move', (e) => {
      if (e.target && this.canvasService.isObjectProtected(e.target as unknown as {id: string})) {
        this.canvas.defaultCursor = 'not-allowed';
      } else {
        this.canvas.defaultCursor = 'default';
      }
    });

    // Prevent any movement of protected objects
    this.canvas.on('object:moving', (e) => {
      const movingObject = e.target as any;
      if (movingObject && this.canvasService.isObjectProtected(movingObject)) {
        e.e.preventDefault();
        e.e.stopPropagation();
      }
      
      // Check if group selection contains protected objects
      if (movingObject && movingObject.type === 'activeSelection') {
        const hasProtectedObject = movingObject.getObjects().some((obj: any) => this.canvasService.isObjectProtected(obj));
        if (hasProtectedObject) {
          e.e.preventDefault();
          e.e.stopPropagation();
        }
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { fabric } from 'fabric';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { IObjectOptions } from 'fabric/fabric-impl';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgIf } from '@angular/common';

/**
 * @description Represents the Shapes Menu Component responsible for managing and displaying shape objects.
 * This component handles the display of different shapes such as square, circle, triangle, star,
 * line, and heart. Users can customize properties such as color, opacity, and border width for
 * the selected shape object.
 */
@Component({
  selector: 'app-shapes-menu',
  templateUrl: './shapes-menu.component.html',
  styleUrls: ['./shapes-menu.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    ColorPickerModule,
    FormsModule,
    MatSlider,
    MatSliderThumb,
    ReactiveFormsModule
  ]
})
export class ShapesMenuComponent implements OnInit {
  borderColor = '#000';
  fillColor = '#000';
  opacity = new UntypedFormControl(100);
  borderWidth = 0;

  mode = 'new';
  activeObject: fabric.Object;
  constructor(
    public canvasService: CheckdesignCanvasService,
    public _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.canvasService.activeMenu$.subscribe((menu) => {
      if (menu?.name !== 'menu-shapes') {
        return;
      }
      this.mode = menu.mode;
      if (menu?.mode === 'edit' && menu?.activeObject) {
        this.activeObject = menu.activeObject;
      }
    });

    this.opacity.valueChanges.subscribe((value) => {
      this.canvasService.changeOpacity(this.activeObject, value);
    });
  }

  /**
   * @description Adds a shape object to the canvas based on the selected shape type.
   * @param shape - The type of shape to be added (e.g., "square", "circle", "triangle").
   */
  addShape(shape: string) {
    let object = undefined;
    const shapeOptions = this.canvasService.objectProperties();
    shapeOptions.left = 50;
    shapeOptions.top = 50;
    shapeOptions.fill = '#000';
    shapeOptions.stroke = '#000';
    shapeOptions.strokeWidth = 0;
    shapeOptions.opacity = 1;
    shapeOptions.ctype = 'shape';
    shapeOptions.id = 'new-shape';

    if (shape === 'square') {
      shapeOptions.width = 60;
      shapeOptions.height = 60;
      object = new fabric.Rect(shapeOptions);
    } else if (shape === 'circle') {
      shapeOptions.radius = 40;
      object = new fabric.Circle(shapeOptions);
    } else if (shape === 'triangle') {
      shapeOptions.width = 70;
      shapeOptions.height = 70;
      object = new fabric.Triangle(shapeOptions);
    } else if (shape === 'star') {
      shapeOptions.strokeLineJoin = 'bevil';
      const points = this.starPolygonPoints(5, 50, 25);
      object = new fabric.Polygon(points, shapeOptions);
    } else if (shape === 'line') {
      shapeOptions.strokeWidth = this.borderWidth > 0 ? this.borderWidth : 1;
      object = new fabric.Line([100, 100, 600, 100], shapeOptions);
    } else if (shape === 'heart') {
      shapeOptions.strokeLineJoin = 'bevil';
      shapeOptions.scaleX = 0.2;
      shapeOptions.scaleY = 0.2;
      shapeOptions.strokeWidth = this.borderWidth * 5;
      object = this.getHeartObject(shapeOptions);
    }

    if (object) {
      this.canvasService.canvas.add(object);
      this.canvasService.setActiveObject(object);
      this.canvasService.renderAll();
    }
  }

  /**
   * @description Calculates the points of a star polygon.
   *
   * @param spikeCount - The number of spikes in the star.
   * @param outerRadius - The radius of the outer points.
   * @param innerRadius - The radius of the inner points.
   * @returns An array of points representing the star polygon.
   */
  starPolygonPoints(
    spikeCount: number,
    outerRadius: number,
    innerRadius: number
  ) {
    const cx = outerRadius;
    const cy = outerRadius;
    const sweep = Math.PI / spikeCount;
    const points = [];
    let angle = 0;

    for (let i = 0; i < spikeCount; i++) {
      let x = cx + Math.cos(angle) * outerRadius;
      let y = cy + Math.sin(angle) * outerRadius;
      points.push({ x: x, y: y });
      angle += sweep;

      x = cx + Math.cos(angle) * innerRadius;
      y = cy + Math.sin(angle) * innerRadius;
      points.push({ x: x, y: y });
      angle += sweep;
    }
    return points;
  }

  /**
   * @description Generates a fabric.js object for a heart shape.
   * @param shapeOptions - Options for configuring the heart shape.
   * @returns A fabric.js Path object representing a heart shape.
   */
  getHeartObject(shapeOptions: IObjectOptions) {
    const shapeObject = new fabric.Path(
      'M 272.70141,238.71731 \
                C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731  \
                C 152.70146,493.47282 288.63461,528.80461 381.26391,662.02535 \
                C 468.83815,529.62199 609.82641,489.17075 609.82641,358.71731 \
                C 609.82641,292.47731 556.06651,238.7173 489.82641,238.71731  \
                C 441.77851,238.71731 400.42481,267.08774 381.26391,307.90481 \
                C 362.10311,267.08773 320.74941,238.7173 272.70141,238.71731  \
                z ',
      shapeOptions
    );
    return shapeObject;
  }

  /**
   * @description Changes the border color of the active shape object.
   * @param stroke - The new border color value.
   */
  changeBorderColor(stroke: string) {
    this.activeObject.set({ stroke });
    this.canvasService.renderAll();
  }

  /**
   * @description Changes the fill color of the active shape object.
   * @param fill - The new fill color value.
   */
  changeFillColor(fill: string) {
    this.activeObject.set({ fill });
    this.canvasService.renderAll();
  }

  /**
   * @description Changes the border width of the active shape object.
   * @param strokeWidth - The new border width value.
   */
  changeBorderWidth(strokeWidth: number) {
    this.activeObject.set({ strokeWidth });
    this.canvasService.renderAll();
  }
}

import { Component, OnInit } from '@angular/core';
import { ICheckDesignObjects } from 'src/app/models/check-design';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { FormsModule } from '@angular/forms';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';

/**
 * @description Represents cloud bank edit image component
 */
@Component({
  selector: 'app-edit-image',
  templateUrl: './edit-image.component.html',
  styleUrls: ['./edit-image.component.scss'],
  standalone: true,
  imports: [MatSlider, FormsModule, MatSliderThumb]
})
export class EditImageComponent implements OnInit {
  activeObject: ICheckDesignObjects;
  opacity = 100;

  constructor(public canvasService: CheckdesignCanvasService) {}

  ngOnInit(): void {
    this.canvasService.activeMenu$.subscribe((menu) => {
      if (menu.name === 'edit-image') {
        this.activeObject = menu?.activeObject as ICheckDesignObjects;
      }
    });
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCirclePlay } from '@fortawesome/pro-solid-svg-icons';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-intro-tour-button',
  standalone: true,
  imports: [FontAwesomeModule, AngularMaterialModule],
  templateUrl: './intro-tour-button.component.html',
  styleUrl: './intro-tour-button.component.scss'
})
export class IntroTourButtonComponent {

  @Output() clickEvent = new EventEmitter();

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  faCirclePlay = faCirclePlay;

  onClick() : void {
    this.clickEvent.emit();
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-ocw-policy',
  standalone: true,
  imports: [],
  templateUrl: './ocw-policy.component.html',
  styleUrl: './ocw-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcwPolicyComponent {
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
}

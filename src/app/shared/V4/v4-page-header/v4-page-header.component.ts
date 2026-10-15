import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { Location } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import {
  CommonButtonV4Component,
  TCButtonType
} from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IV4HeaderAction } from './v4-page-header.model';

@Component({
  selector: 'app-v4-page-header',
  standalone: true,
  templateUrl: './v4-page-header.component.html',
  styleUrl: './v4-page-header.component.scss',
  imports: [
    CommonButtonV4Component,
    AngularMaterialModule,
    LucideAngularModule
  ],
  // `title` is a native global attribute, so a static `title="..."` on the host
  // is reflected into the DOM as well as bound to the input — which makes the
  // browser show its own stock tooltip over the whole header. Strip it so only
  // the intentional v4 tooltips show.
  host: { '[attr.title]': 'null' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4PageHeaderComponent {
  private location = inject(Location);

  title = input.required<string>();
  subtitle = input('');
  // Material renders nothing for an empty message, so pages that don't opt in
  // keep a plain, tooltip-less title.
  titleToolTip = input('');
  actions = input<IV4HeaderAction[]>([]);
  showBackButton = input(false);
  backButtonType = input<'handleInside' | 'takeEvent'>('handleInside');

  actionClick = output<string | number>();
  backEvent = output();

  goBack(): void {
    if (this.backButtonType() === 'handleInside') {
      this.location.back();
    } else {
      this.backEvent.emit();
    }
  }

  buttonType(action: IV4HeaderAction): TCButtonType {
    return { name: 'v2-1', size: 'md', style: action.style ?? 'navy' };
  }
}

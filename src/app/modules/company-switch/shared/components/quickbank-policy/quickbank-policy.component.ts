import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-quickbank-policy',
  standalone: true,
  imports: [CommonModule,FormsModule,CommonButtonV35Component],
  templateUrl: './quickbank-policy.component.html',
  styleUrl: './quickbank-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickbankPolicyComponent {}

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleDollar } from '@fortawesome/pro-regular-svg-icons';
import {
  faCalendar,
  faClose,
  faPlus,
  faCircleXmark
} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-refer-and-earn-commission-modal',
  standalone: true,
  imports: [FaIconComponent, MatDialogClose, NgClass],
  templateUrl: './refer-and-earn-commission-modal-new.component.html',
  styleUrl: './refer-and-earn-commission-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferAndEarnCommissionModalComponent {
  faPlus = faPlus;
  faCalender = faCalendar;
  faClose = faClose;
  faCircleXmark = faCircleXmark;
  faCircleDollar = faCircleDollar;

  data = [
    {
      title: {
        text: 'Credits Granted (upto 1000 Available)',
        color: 'bg-common-secondary-blue-color'
      },
      values: [
        0, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
        800, 850, 900, 950, 1000
      ],
      italic: false
    },
    {
      title: {
        text: 'Referrer Commission (%)',
        color: 'bg-common-secondary-green-color'
      },
      values: [
        50, 45, 42.5, 40, 37.5, 35, 32.5, 30, 27.5, 25, 22.5, 20, 17.5, 15,
        12.5, 10, 7.5, 5, 2.5, 0
      ],
      italic: true
    }
  ] as const;


  commissionData = [
    {
      levelText:'Level 1',
      commPercentage:16
    },
    {
      levelText:'Level 2',
      commPercentage:8
    },
    {
      levelText:'Level 3',
      commPercentage:4
    },
    {
      levelText:'Level 4',
      commPercentage:2
    },
    {
      levelText:'Level 5',
      commPercentage:1
    }
  ];
}

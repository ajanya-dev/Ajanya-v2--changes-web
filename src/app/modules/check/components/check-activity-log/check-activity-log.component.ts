import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DeviceModalComponent } from 'src/app/shared/modal/device-modal/device-modal/device-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { NgFor, NgIf } from '@angular/common';

export interface IActivityLogModel {
  id: string;
  date: string;
  status: string;
  activityBy: string;
  location: string;
  ipAddress: string;
  notes: string;
}

@Component({
  selector: 'app-check-activity-log',
  templateUrl: './check-activity-log.component.html',
  styleUrls: ['./check-activity-log.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf]
})
export class CheckActivityLogComponent implements OnChanges, OnDestroy {
  activityData: IActivityLogModel[];
  subscriptions: Subscription[] = [];
  @Input() checkId: string;
  isLegalEnabled: boolean;
  constructor(
    public __dialog: MatDialog,
    private _checkService: CheckService,
    private _headerService: HeaderService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const checkId: SimpleChange = changes.checkId;
    this.checkId = checkId.currentValue;
    if (checkId != undefined) this.loadedHeaderDataAndProcess();
    this.loadCheckActivity();
  }

  loadedHeaderDataAndProcess() {
    this._headerService._headerData.subscribe((headerData) => {
      if (headerData) {
        if (headerData.personalInfo?.isLegalEnabled) {
          this.isLegalEnabled = true;
        }
      }
    });
  }

  editDeviceName(deviceAddress: string): void {
    const dialogRef = this.__dialog.open(DeviceModalComponent, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true,
      data: { deviceAddress: deviceAddress }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.loadCheckActivity();
      }
    });
  }

  loadCheckActivity(): void {
    this.subscriptions.push(
      this._checkService
        .getCheckActivity(this.checkId)
        .subscribe((res: any) => {
          if (res?.success) {
            this.activityData = this.processActivityData(res.data);
          }
        })
    );
  }

  processActivityData(activityData: IActivityLogModel[]): IActivityLogModel[] {
    if (this.isLegalEnabled) {
      let printedOnce: boolean;
      activityData.reverse().forEach((ele) => {
        ele.date = this.formatDate(ele.date);

        if (ele.status == 'Printed' && printedOnce) {
          ele.status = 'Re-Printed';
        } else if (ele.status == 'Printed') {
          printedOnce = true;
        }
      });
      return activityData.reverse();
    }
    activityData.forEach((ele) => {
      ele.date = this.formatDate(ele.date);
    });
    return activityData;
  }

  formatDate(dateStr: string) {
    const [datePart, timePart] = dateStr.split(' - ');
    const [day, month, year] = datePart.split(' ');

    const months: { [key: string]: string } = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12'
    };

    const formattedDate = `${months[month]}-${day.padStart(2, '0')}-${year}`;

    return `${formattedDate} ${timePart.toUpperCase()}`;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

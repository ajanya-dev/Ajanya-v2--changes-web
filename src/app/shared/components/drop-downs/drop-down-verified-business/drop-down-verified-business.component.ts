import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { IBusinessList } from 'src/app/modules/business-tools/plexe/model/plexe';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * @description Drop down component for verified business.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  selector: 'app-drop-down-verified-business',
  templateUrl: './drop-down-verified-business.component.html',
  styleUrls: ['./drop-down-verified-business.component.scss']
})
export class DropDownVerifiedBusinessComponent implements OnInit, OnDestroy {
  @Input() id = 'id';
  @Input() isRequired = false;
  @Input() placeholder = 'Select your business';
  @Output() selectionEvent = new EventEmitter();
  businessList: IBusinessList[];
  subscription: Subscription[] = [];
  enableAddNew = true;

  constructor(
    private sharedService: SharedService,
    private router: Router
  ) {}

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  ngOnInit(): void {
    this.getBusinessList();
  }

  /**
   * @description Loads list of verified business and sets it to `this.businessList`.
   */
  getBusinessList(): void {
    this.subscription.push(
      this.sharedService.getVerifiedBusiness().subscribe((res) => {
        this.businessList = res?.data;
        if (this.businessList.length) {
          this.enableAddNew = false;
        } else {
          this.enableAddNew = true;
        }
      })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made.
   * If event is `add-new`, then redirect to user verification page.
   * Navigate to user verification page based on `this.isV3Layout`.If `this.isV3Layout` is true then navigate to v3 user verification page,otherwise v2 verification page.
   * @param event - selection event in template.
   */
  onChange(event: string | 'add-new') {
    if (event === 'add-new') {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: { returnUrl: 'manage/working-capital/apply' }
      });
      this.ngSelectComponent.handleClearClick();
      return;
    }
    this.selectionEvent.emit(event);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

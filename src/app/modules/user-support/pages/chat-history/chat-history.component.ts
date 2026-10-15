import { DatePipe, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { JpgPngModalComponent } from '../../modals/jpg-png-modal/jpg-png-modal.component';
import { LocationStrategy } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    ControlMessageComponent,
    FaIconComponent
  ]
})
export class ChatHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
  formData = new FormData();
  userForm: UntypedFormGroup;
  listData: any = [];
  subscriptions: Subscription[] = [];
  message: any;
  mainTime: any;
  btnDesable = false;
  docs!: FormData | null;
  fileName = ' ';
  file: any;
  link!: string;
  typeId: any;
  type: any;
  image: File[] = [];
  fileToUpload: any;
  imageUrl: any;
  url: any;
  chatHistory: any[] = [];
  data: any;
  images: any;
  attachId: any;
  id: any;
  attachment = false;
  urlAttachment: any;
  isactive: boolean;
  loading = false;

  attachArray: any[] = [];
  idarrayAttachmnet: any[] = [];

  constructor(
    private locationStrategy: LocationStrategy,
    private fb: UntypedFormBuilder,
    private datePipe: DatePipe,
    private _supportService: UserSupportService,
    private __dialog: MatDialog,
    private activatedroute: ActivatedRoute,
    private router: Router,
    private _alertService: AlertService
  ) {
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });

    this.activatedroute.queryParams.subscribe((data) => {
      this.data = data;
      if (this.data.status == 1) {
        this.isactive = false;
      } else {
        this.isactive = true;
      }
    });
    this.listData = [];
    this.userForm = this.fb.group({
      message: [''],
      userName: [''],
      createdAt: ['']
    });
  }

  @ViewChild('content') content: ElementRef;
  @ViewChildren('messages') messages: QueryList<any>;

  ngOnInit(): void {
    this.first();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
    this.messages.changes.subscribe(this.scrollToBottom);
  }

  scrollToBottom = () => {
    this.content.nativeElement.scrollTop =
      this.content.nativeElement.scrollHeight;
  };

  first() {
    this.listData = [];
    this.subscriptions.push(
      this._supportService
        .getmessages(this.data.id)
        .pipe(
          finalize(() => {
            setTimeout(() => {
              this.removeLoadedSkelton();
            }, 500);
          })
        )
        .subscribe((res: any) => {
          this.listData = res.data;
        })
    );
  }

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    setTimeout(() => {
      this.router.navigateByUrl('/manage/user-support');
    }, 100);
  }

  // RESOLVED AND REOPEN BUTTON
  reponens = false;
  reOpen() {
    let data;
    this.subscriptions.push(
      this._supportService.reOpen(this.data.id, data).subscribe((res: any) => {
        if (res.success) {
          this.router.navigate([`/manage/user-support/allMessages`], {
            queryParams: {
              id: this.data.id,
              name: this.data.name,
              subject: this.data.subject,
              status: 1
            }
          });
          this.reponens = true;

          if (this.data.status == 1) {
            this.isactive = false;
          } else if (this.data.status == 2) {
            this.isactive = true;
            this.reponens = false;
          }
        } else {
          this.isactive = true;
          this.reponens = false;
        }
      })
    );
  }

  reSolved() {
    let data;
    this.subscriptions.push(
      this._supportService
        .markAsResolve(this.data.id, data)
        .subscribe((res: any) => {
          if (res.success) {
            this.router.navigate([`/manage/user-support/allMessages`], {
              queryParams: {
                id: this.data.id,
                name: this.data.name,
                subject: this.data.subject,
                status: 2
              }
            });
            this.reponens = false;

            if (this.data.status == 1) {
              this.router.navigateByUrl(`/manage/user-support`);
            } else {
              this.isactive = false;
            }
          }
        })
    );
  }

  // RESOLVED AND REOPEN BUTTON

  msg(event: any) {
    if (event.target.value.length == 0) {
      this.btnDesable = false;
    } else {
      this.btnDesable = true;
    }
  }
  enter(message: any) {
    this.btnDesable = false;

    const arrayat: any = [];
    this.attachArray.forEach((attachment) => {
      arrayat.push(attachment.id);
    });

    this.subscriptions.push(
      this._supportService
        .supportQuestion(this.data?.id, {
          message: this.userForm.value.message,
          attachmentIds: arrayat
        })
        .subscribe((res) => {
          this.userForm.reset();
          if (res.success) {
            this.attachArray = [];
            this.first();
            const reader = new FileReader();
            reader.readAsDataURL(this.file); // read file as data url
            reader.onload = (event: any) => {
              // called once readAsDataURL is completed
              this.url = event.target.result;
              if (!this.attachment) {
                this.listData.push({
                  message: message,
                  mainTime: this.mainTime,
                  attachments: this.urlAttachment ? this.urlAttachment : ''
                });
              }
            };
          }
        })
    );

    this.formData.delete('attachment');
  }

  clickAttach(length: number) {
    if (length == 3) {
      const data = {
        content: 'Maximum 3 files allowed',
        isCancel: false
      };
      this._alertService.warningAlert(data);
    }
  }

  onSelectFile(event: any) {
    this.loading = true;
    this.btnDesable = false;

    const time = new Date();
    this.mainTime = this.datePipe.transform(time, 'h:mm a MM-dd-yyyy');
    this.formData.append('attachment', event.target.files[0]);
    this.docs = this.formData;

    this.subscriptions.push(
      this._supportService
        .addAttachments(this.formData)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.btnDesable = true;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.urlAttachment = res?.data;

            this.attachArray.push({
              id: res.data.id,
              imageName: event.target.files[0].name
            });
          }
        })
    );
    if (event.target.files && event.target.files[0]) {
      this.attachment = true;
      this.fileName = event.target.files[0].name;
      this.file = event.target.files[0];
      const my_label = document.querySelector('.my_label')!;
      my_label.classList.add('file_add');
    }
  }

  onRemove(id: any, i: number) {
    this.subscriptions.push(
      this._supportService.deleteAttachment(id).subscribe((res: any) => {
        if (res.success) {
          this.attachArray.splice(i, 1);
          if (this.userForm.value.message == '') {
            this.btnDesable = false;
          }
        }
      })
    );
  }

  getUrl(type: string, id: string) {
    this.subscriptions.push(
      this._supportService.openAttachment(id).subscribe((res: any) => {
        if (res.success) {
          if (type == 'png' || type == 'jpg') {
            if (res.data.url) {
              this.__dialog.open(JpgPngModalComponent, {
                //open modal
                maxWidth: '510px',
                width: '93%',
                data: res.data.url
              });
            }
          } else {
            window.open(res.data.url);
          }
        }
      })
    );
  }

  //===> Remove skelton loader

  removeLoadedSkelton() {
    const chats: NodeListOf<HTMLElement> =
      document.querySelectorAll('.skelton');

    chats.forEach((item) => item.classList.remove('skelton'));
  }

  //===> Remove skelton loader

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NpsService } from 'src/app/shared/service/nps/nps.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgFor, NgClass } from '@angular/common';

/**
 * Interface representing the NPS score and its class.
 */
interface InpsCoresArr {
  score: number;
  class: string;
}

/**
 * Interface representing an HTML element with a class list.
 */
interface INPSElementWithClassList {
  classList: {
    add(className: string): void;
    remove(className: string): void;
  };
}

@Component({
  selector: 'app-nps',
  templateUrl: './nps.component.html',
  styleUrls: ['./nps.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgClass
  ]
})
export class NpsComponent implements OnInit, OnDestroy {
  /**
   * Flag indicating whether the component is in a loading state.
   */
  loading = false;

  /**
   * The count of the NPS score.
   */
  scoreCount = 0;

  /**
   * Flag to show or hide the NPS form.
   */
  showNps = true;

  /**
   * The NPS form group.
   */
  npsForm!: UntypedFormGroup;

  /**
   * Array of NPS score objects.
   */
  npsCoresArr: InpsCoresArr[];

  /**
   * Array of subscriptions for managing observable subscriptions.
   */
  subscriptions: Subscription[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private _npsService: NpsService,
    private _alertService: AlertService,
    private _localStorageService: LocalStorageService
  ) {}

  /**
   * Lifecycle hook called when the component is initialized.
   */
  ngOnInit(): void {
    this.npsFormInit();
    this.npsScores();

    this.subscriptions.push(
      this._npsService.getNPSVal().subscribe((resp) => {
        this.showNps = resp;
      })
    );

    const localVal = this._localStorageService.getItem('NPSVal');
    const localRem = this._localStorageService.getItem('NpsRemind');

    if (localVal != null || localRem != null) {
      this.showNps = false;
    }
  }

  /**
   * Initializes the NPS Form.
   */
  npsFormInit() {
    this.npsForm = this.fb.group({
      feedback: new UntypedFormControl('')
    });
  }

  /**
   * Retrieves the data from the NPS Form.
   * @returns {Object} - The data containing the score and feedback comment.
   */
  npsFormBody() {
    const data = {
      score: this.scoreCount,
      comment: this.npsForm.value.feedback
    };
    return data;
  }

  /**
   * Submits the NPS Form to a POST API.
   */
  npsFormSubmit() {
    if (this.npsForm.invalid) {
      this.npsForm.markAllAsTouched();
      return;
    }

    const data = {
      title: 'Thank You!',
      content: 'Your feedback helps us improve our service.',
      close: true,
      timeout: 5000
    };

    this.loading = true;
    this.subscriptions.push(
      this._npsService
        .saveNpsScore(this.npsFormBody())
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((resp) => {
          if (resp.success) {
            this._localStorageService.setItem('NPSVal', 1);
            this._alertService.successAlert(data);
            this.showNps = false;
            this._npsService.setNPSVal(false);
          }
        })
    );
  }

  /**
   * Defines the NPS Score options.
   */
  npsScores() {
    this.npsCoresArr = [
      {
        score: 1,
        class: 'detractor'
      },
      {
        score: 2,
        class: 'detractor'
      },
      {
        score: 3,
        class: 'detractor'
      },
      {
        score: 4,
        class: 'detractor'
      },
      {
        score: 5,
        class: 'passive'
      },
      {
        score: 6,
        class: 'passive'
      },
      {
        score: 7,
        class: 'promoter'
      },
      {
        score: 8,
        class: 'promoter'
      },
      {
        score: 9,
        class: 'promoter'
      },
      {
        score: 10,
        class: 'promoter'
      }
    ];
  }

  /**
   * Submits a POST request to remind later.
   */
  remindClose() {
    let data;
    this.subscriptions.push(
      this._npsService.remindMeLater(data).subscribe(() => {
        this._npsService.setNPSVal(false);
        this._localStorageService.setItem('NpsRemind', 1);
      })
    );
  }

  /**
   * Highlights the selected NPS score.
   * @param {HTMLLIElement} element - The HTML list element to highlight.
   */
  hilight(element: HTMLLIElement) {
    let currentEl = element;

    const prevElArray: HTMLLIElement[] = [];
    const nextElArray: HTMLLIElement[] = [];
    (() => {
      const first = element;
      first.classList.add('hover');
      while ((element = element.previousElementSibling as HTMLLIElement)) {
        prevElArray.push(element);
      }

      prevElArray.forEach((el: INPSElementWithClassList) => {
        el.classList.add('hover');
      });
    })(),
      (() => {
        while ((currentEl = currentEl.nextElementSibling as HTMLLIElement)) {
          nextElArray.push(currentEl);
        }
        nextElArray.forEach((el: INPSElementWithClassList) => {
          el.classList.remove('hover');
        });
      })();
  }

  /**
   * Queries for elements using a given CSS selector.
   * @param {string} path - The CSS selector path.
   * @returns {NodeListOf<Element>} - The list of elements matching the selector.
   */
  querySelector(path: string) {
    const current = document.querySelectorAll(path)!;
    return current;
  }

  /**
   * Removes the highlight from all NPS scores.
   */
  removeHilight() {
    const scoreList = this.querySelector('.score_wrapper li');

    scoreList.forEach((el: INPSElementWithClassList) => {
      el.classList.remove('hover');
    });
  }

  /**
   * Initializes the selected NPS score and updates the form's validation.
   * @param {number} score - The selected NPS score.
   * @param {INPSElementWithClassList} el - The HTML element representing the selected score.
   */
  scoreInit(score: number, el: INPSElementWithClassList) {
    const scoreList = this.querySelector('.score_wrapper li');

    scoreList.forEach((el: INPSElementWithClassList) => {
      el.classList.remove('active');
    });
    el.classList.add('active');
    this.scoreCount = score;

    if (this.scoreCount <= 6) {
      this.npsForm.controls.feedback.setValidators(Validators.required);
      this.npsForm.controls.feedback.updateValueAndValidity();
    } else {
      this.npsForm.controls.feedback.clearValidators();
      this.npsForm.controls.feedback.updateValueAndValidity();
    }
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

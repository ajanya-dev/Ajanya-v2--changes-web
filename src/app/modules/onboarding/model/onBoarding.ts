export type onBoardStatusType =
  | 'old_user'
  | 'step1_completed'
  | 'step1_skip_clicked'
  | 'step1_no_clicked'
  | 'not_onboarded'
  | 'whats_new_step_one'
  | 'whats_new_step_two'
  | 'step2_skip_clicked'
  | 'step2_completed';

export interface IonBoardingDetails {
  onBoardStatus: onBoardStatusType;
  onBoardingLoginCount?: number[];
  slide?: number;
  bussinessDetailsFormData?: any;
  helpList?: any;
}

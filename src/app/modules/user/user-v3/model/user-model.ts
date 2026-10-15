import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface IGetStartedCard {
  level: string;
  icon1: IconProp;
  icon2: IconProp;
  iconPartiallyCompleted: IconProp;
  content: string;
  contentPartiallyCompleted: string;
  features: string[];
  stepCompleted: boolean;
  stepPartiallyCompleted: boolean;
  stepRejected: boolean;
  cardColor: string;
  onClickUrl: string;
}

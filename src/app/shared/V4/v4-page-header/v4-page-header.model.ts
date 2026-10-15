import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface IV4HeaderAction {
  id: string | number;
  text: string;
  style?: 'primary' | 'navy' | 'danger' | 'muted';
  lucideIcon?: string;
  /** FontAwesome icon. Rendered only when `isAddIcon` is set and `lucideIcon` is not. */
  icon?: IconProp;
  isAddIcon?: boolean;
  disabled?: boolean;
  loading?: boolean;
  toolTip?: string;
  menu?: { id: string | number; name: string; lucideIcon?: string }[];
}

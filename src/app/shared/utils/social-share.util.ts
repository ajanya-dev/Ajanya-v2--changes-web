import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faFacebookF,
  faXTwitter,
  faLinkedinIn,
  faTelegram,
  faRedditAlien
} from '@fortawesome/free-brands-svg-icons';

export interface ISocialTarget {
  key: string;
  name: string;
  icon: IconDefinition;
  color: string;
}

/**
 * Networks behind the "More" row of the proof and receipt modals. Kept to the
 * ones with a public web share intent that takes an arbitrary link —
 * Instagram, TikTok, Snapchat, Discord, Signal and Messenger have no such URL
 * (they need a native app, an app id or an SDK), so a tile for them could only
 * open an empty compose screen.
 */
export const SOCIAL_TARGETS: ISocialTarget[] = [
  { key: 'facebook', name: 'Facebook', icon: faFacebookF, color: '#1877F2' },
  { key: 'x', name: 'X', icon: faXTwitter, color: '#000000' },
  { key: 'linkedin', name: 'LinkedIn', icon: faLinkedinIn, color: '#0A66C2' },
  { key: 'telegram', name: 'Telegram', icon: faTelegram, color: '#26A5E4' },
  { key: 'reddit', name: 'Reddit', icon: faRedditAlien, color: '#FF4500' }
];

/**
 * The web share intent for one network. `caption` is a plain one-line title;
 * Facebook and LinkedIn drop any caption a third party passes, so they get the
 * link alone.
 */
export function socialShareUrl(
  key: string,
  url: string,
  caption: string
): string {
  const link = encodeURIComponent(url);
  const title = encodeURIComponent(caption);

  switch (key) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${link}`;
    case 'x':
      return `https://twitter.com/intent/tweet?url=${link}&text=${title}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
    case 'telegram':
      return `https://t.me/share/url?url=${link}&text=${title}`;
    case 'reddit':
      return `https://www.reddit.com/submit?url=${link}&title=${title}`;
    default:
      return url;
  }
}

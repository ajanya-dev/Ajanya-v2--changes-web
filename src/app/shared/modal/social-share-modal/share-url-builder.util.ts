/**
 * Social Media Sharing Configuration
 *
 * This file contains all the configuration for different social media platforms
 * including URL builders, success messages, and error messages.
 */

export class ShareUrlBuilderUtil {
  static buildUrl(url: string) {
    return url;
  }
}

export interface SocialMediaConfig {
  name: string;
  url: string;
  bgColor: string;
  iconColor: string;
}

export const socialMediaConfigs: Record<string, SocialMediaConfig> = {
  pinterest: {
    name: 'Pinterest',
    url: 'https://www.pinterest.com/sharer/sharer.php?u={url}',
    bgColor: '#E60023',
    iconColor: '#ffffff'
  },
  instagram: {
    name: 'Instagram',
    url: 'https://www.instagram.com/share?url={url}',
    bgColor: '#E1306C',
    iconColor: '#ffffff'
  },
  telegram: {
    name: 'Telegram',
    url: 'https://telegram.me/share/url?url={url}',
    bgColor: '#229ED9',
    iconColor: '#ffffff'
  },
  youtube: {
    name: 'YouTube',
    url: 'https://www.youtube.com/watch?v={url}',
    bgColor: '#FF0000',
    iconColor: '#ffffff'
  },
  snapchat: {
    name: 'Snapchat',
    url: 'https://www.snapchat.com/share?url={url}',
    bgColor: '#FFFC00',
    iconColor: '#111827'
  },
  tiktok: {
    name: 'TikTok',
    url: 'https://www.tiktok.com/share?url={url}',
    bgColor: '#000000',
    iconColor: '#ffffff'
  },
  reddit: {
    name: 'Reddit',
    url: 'https://www.reddit.com/submit?url={url}',
    bgColor: '#FF4500',
    iconColor: '#ffffff'
  },
  weChat: {
    name: 'WeChat',
    url: 'https://www.wechat.com/share?url={url}',
    bgColor: '#07C160',
    iconColor: '#ffffff'
  },
  copy: {
    name: 'Copy',
    url: '{url}',
    bgColor: '#E5E7EB',
    iconColor: '#374151'
  },
};


export interface QuickShareConfig {
  key: string;
  name: string;
  url: string;
  bgColor: string;
  iconColor: string;
  /** @deprecated used by v3 add-payee-modal */
  icon: string;
  /** @deprecated used by v3 add-payee-modal */
  class: string;
}

export const socialShareData: QuickShareConfig[] = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://wa.me/?text={url}',
    bgColor: '#25D366',
    iconColor: '#ffffff',
    icon: 'assets/icon/socialshare/whatsapp.svg',
    class: 'text-common-green-color bg-common-secondary-green-color'
  },
  {
    key: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/sharer/sharer.php?u={url}',
    bgColor: '#1877F2',
    iconColor: '#ffffff',
    icon: 'assets/icon/socialshare/facebook.svg',
    class: 'text-common-blue-color bg-common-secondary-blue-color'
  },
  {
    key: 'x',
    name: 'X',
    url: 'https://x.com/share?url={url}',
    bgColor: '#000000',
    iconColor: '#ffffff',
    icon: 'assets/icon/socialshare/x.svg',
    class: 'text-common-blue-color bg-common-secondary-blue-color'
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/shareArticle?url={url}',
    bgColor: '#0A66C2',
    iconColor: '#ffffff',
    icon: 'assets/icon/linkedin.svg',
    class: 'text-common-blue-color bg-common-secondary-blue-color'
  },
];
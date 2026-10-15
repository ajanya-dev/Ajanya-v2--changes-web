export const V4_EXTERNAL_PATH = 'v4/external';
export const MAIL_TRACK_PATH = 'mail-track';

export function getMailTrackUrl(trackingCode: string): string {
  return `${window.location.origin}/${V4_EXTERNAL_PATH}/${MAIL_TRACK_PATH}/${trackingCode}`;
}

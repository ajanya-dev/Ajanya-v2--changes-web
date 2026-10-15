/**
 * Single source of truth for the file formats accepted when a customer uploads a
 * card picture / invoice for payment verification.
 *
 * The same list has to be honoured in three places (the in-app modal, its V4
 * counterpart and the "upload from phone" page in the `outside` module), so it
 * lives here rather than being repeated per component.
 */
export const VERIFICATION_DOCUMENT_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.pdf'
];

/** Value for the `accept` attribute of the file inputs. */
export const VERIFICATION_DOCUMENT_ACCEPT =
  VERIFICATION_DOCUMENT_EXTENSIONS.join(',');

/** Message shown when the picked file is not one of the accepted formats. */
export const VERIFICATION_DOCUMENT_ERROR =
  'This file type is not allowed. Please upload JPG, JPEG, PNG, WEBP, HEIC, or PDF.';

/**
 * MIME types matching the extensions above. Phone cameras and scanner apps
 * sometimes hand over a file whose name carries no extension, in which case the
 * browser reported type is the only thing left to validate against.
 */
const VERIFICATION_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'application/pdf'
];

/**
 * @description Checks whether a picked file is one of the accepted verification
 * document formats, by extension first and by MIME type when the name has none.
 * @param file - The file selected through the input element.
 * @returns True when the file may be uploaded.
 */
export function isAcceptedVerificationDocument(file: File): boolean {
  const name = file?.name ?? '';
  const separatorIndex = name.lastIndexOf('.');

  if (separatorIndex > 0) {
    const extension = name.slice(separatorIndex).toLowerCase();
    if (VERIFICATION_DOCUMENT_EXTENSIONS.includes(extension)) return true;
  }

  return VERIFICATION_DOCUMENT_MIME_TYPES.includes(
    (file?.type ?? '').toLowerCase()
  );
}

/** Which flow opened the Persona modal. Decides how a pre-created inquiry is resumed. */
export type PersonaModalMode = 'default' | 'enterprise';

export interface IPusherResponse {
  inquiry_id: string | null;
  user_id: number | null;
  kyb_id?: string | null;
  inquiry_type: 'kyc' | 'kyb' | null;
  edd_inquiry_id?: string| null;
  edd_required:boolean | null;
}

import type { ClinicSettings } from '../types'

export const DEFAULT_PRIMARY = '#20ae8d'
export const DEFAULT_ACCENT = '#ff690c'

export function defaultClinicSettings(): ClinicSettings {
  return {
    clinicName: 'HEARING HOPE',
    tagline: 'Audiology & Speech Clinic',
    address: 'Address line 1, City, State, PIN',
    phone: '+91-XXXXXXXXXX',
    email: 'clinic@email.com',
    website: '',
    logoDataUrl: null,
    primaryColor: DEFAULT_PRIMARY,
    accentColor: DEFAULT_ACCENT,
    footerNote: 'This report is computer generated and intended for clinical correlation.',
    whatsappMessageTemplate:
      'Audiology Report: {patientName} ({date}). Please find the attached PDF.',
    settingsAccess: null,
  }
}



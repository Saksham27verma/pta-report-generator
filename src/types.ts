export type Gender = 'Male' | 'Female' | 'Other'

export const AUDIO_FREQS = [250, 500, 1000, 2000, 4000, 8000] as const
export type AudioFrequency = (typeof AUDIO_FREQS)[number]
export type EarSide = 'right' | 'left'
export type ConductionType = 'air' | 'bone'

export type AudiometryPoint = {
  /** dB HL value. Null means not filled. */
  db: number | null
  masked: boolean
  nr: boolean
}

export type AudiometryEar = Record<AudioFrequency, { air: AudiometryPoint; bone: AudiometryPoint }>

export type AudiometryData = {
  right: AudiometryEar
  left: AudiometryEar
}

export type TuningForkTests = {
  rinneRight: 'Positive' | 'Negative' | ''
  rinneLeft: 'Positive' | 'Negative' | ''
  weber: 'Central' | 'Left' | 'Right' | ''
}

export type SpecialTestsEar = {
  srtDb: number | null
  sdsPercent: number | null
  uclDb: number | null
}

export type SpecialTests = {
  right: SpecialTestsEar
  left: SpecialTestsEar
}

export type Pta = {
  auto: boolean
  right: number | null
  left: number | null
}

export type PatientInfo = {
  name: string
  age: number | null
  gender: Gender | ''
  dateOfTest: string // YYYY-MM-DD
  registrationNumber: string
  referredBy: string
  briefHistory: string
}

export type Diagnosis = {
  provisionalDiagnosis: string
  recommendations: string
  audiologistId: string | null
  signatureDataUrl: string | null
  audiologistName: string
  audiologistRciNumber: string
}

export type ReportDoc = {
  id?: string
  createdByUid: string
  createdAt?: any
  updatedAt?: any

  patient: PatientInfo
  audiometry: AudiometryData
  tuningFork: TuningForkTests
  pta: Pta
  specialTests: SpecialTests
  diagnosis: Diagnosis
}

export type ReportSummary = {
  id: string
  patientName: string
  registrationNumber: string
  dateOfTest: string
  audiologistId?: string | null
  audiologistName?: string
}

export type ClinicSettings = {
  clinicName: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  logoDataUrl: string | null
  primaryColor: string
  accentColor: string
  footerNote: string
  /** WhatsApp message template used when sharing a report. */
  whatsappMessageTemplate: string
  /**
   * Optional password gate for opening the Clinic Settings page.
   * Stored as salted hash (never store plaintext password).
   */
  settingsAccess?: { salt: string; hash: string; updatedAt?: any } | null
}

export type AudiologistProfile = {
  id: string
  name: string
  rciNumber: string
  signatureDataUrl: string | null
}

export type AiDiagnosisAssist = {
  generatedAtIso: string
  summary: string
  suggestedText: string
  reasoning: string[]
  redFlags: string[]
}



import { AUDIO_FREQS, type AudiometryData, type AudiometryEar, type AudiometryPoint, type ReportDoc } from '../types'

const emptyPoint = (): AudiometryPoint => ({ db: null, masked: false, nr: false })

function makeEar(): AudiometryEar {
  const ear = {} as AudiometryEar
  for (const f of AUDIO_FREQS) {
    ear[f] = { air: emptyPoint(), bone: emptyPoint() }
  }
  return ear
}

export function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function defaultAudiometry(): AudiometryData {
  return { right: makeEar(), left: makeEar() }
}

export function defaultReport(createdByUid: string): ReportDoc {
  return {
    createdByUid,
    patient: {
      name: '',
      age: null,
      gender: '',
      dateOfTest: todayISO(),
      registrationNumber: '',
      referredBy: '',
      briefHistory: '',
    },
    audiometry: defaultAudiometry(),
    tuningFork: {
      rinneRight: '',
      rinneLeft: '',
      weber: '',
    },
    pta: { auto: true, right: null, left: null },
    specialTests: {
      right: { srtDb: null, sdsPercent: null, uclDb: null },
      left: { srtDb: null, sdsPercent: null, uclDb: null },
    },
    diagnosis: {
      provisionalDiagnosis: '',
      recommendations: '',
      audiologistId: null,
      signatureDataUrl: null,
      audiologistName: '',
      audiologistRciNumber: '',
    },
  }
}



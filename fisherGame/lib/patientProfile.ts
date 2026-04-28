export interface PatientProfile {
  name: string
  birthYear: string
  motherName: string
  petName: string
  hometown: string
}

// Perfil por defecto para el pitch
export const DEFAULT_PATIENT: PatientProfile = {
  name: "Usuario Demo",
  birthYear: "1976",
  motherName: "María",
  petName: "Bobby",
  hometown: "Madrid"
}

// Reto de vocal sostenida /a/
export const VOCAL_CHALLENGE = {
  question: "Di 'Aaaaa' durante 3 segundos",
  instruction: "Mantén el sonido de forma continua",
  targetDuration: 3000  // texto en pantalla
}

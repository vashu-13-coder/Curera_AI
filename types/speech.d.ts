// Minimal Web Speech API declarations used by components/assistant/VoiceInput.tsx
// We avoid declaring `SpeechRecognition` globally so we don't clash with lib.dom.

export interface WebSpeechAlternative {
  readonly transcript: string
  readonly confidence: number
}

export interface WebSpeechResult {
  readonly length: number
  readonly isFinal: boolean
  item(index: number): WebSpeechAlternative
  [index: number]: WebSpeechAlternative
}

export interface WebSpeechResultList {
  readonly length: number
  item(index: number): WebSpeechResult
  [index: number]: WebSpeechResult
}

export interface WebSpeechResultEvent extends Event {
  readonly resultIndex: number
  readonly results: WebSpeechResultList
}

export interface WebSpeechErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

export interface WebSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((ev: WebSpeechResultEvent) => void) | null
  onerror: ((ev: WebSpeechErrorEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

export interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: WebSpeechRecognitionConstructor
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor
  }
}
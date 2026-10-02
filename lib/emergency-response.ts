// =============================================================================
// CURERA AI — Emergency Response Mapping
//
// Numbers used:
//   112   — India national emergency number
//   108   — India ambulance / emergency medical services
//   14416 — Tele-MANAS mental health helpline (for self_harm)
//
// DOUBLE-CHECK THESE NUMBERS against official sources before the demo.
//
// CURERA does not give treatment advice. Actions are limited to who to call
// and basic safety guidance.
// =============================================================================

import type { EmergencyCategory, EmergencyResponse } from "@/types"

const RESPONSES: Record<EmergencyCategory, EmergencyResponse> = {
  cardiac: {
    title: "Possible cardiac emergency",
    message:
      "The symptoms you described may indicate a heart-related emergency. Please get emergency help immediately.",
    actions: [
      "Call 112 (national emergency) now.",
      "Call 108 (ambulance) for immediate medical transport.",
      "Sit down and rest. Do not drive yourself.",
    ],
  },

  breathing: {
    title: "Possible breathing emergency",
    message:
      "Difficulty breathing can be serious. Please get emergency help right away.",
    actions: [
      "Call 112 (national emergency) now.",
      "Call 108 (ambulance) for immediate transport.",
      "Sit upright. Loosen tight clothing.",
    ],
  },

  bleeding: {
    title: "Possible severe bleeding",
    message: "Heavy or uncontrolled bleeding needs urgent medical attention.",
    actions: [
      "Call 112 (national emergency) now.",
      "Call 108 (ambulance) for immediate transport.",
      "Apply firm, direct pressure to the wound with a clean cloth.",
      "Do not remove an object that is embedded in the wound.",
    ],
  },

  stroke: {
    title: "Possible stroke",
    message:
      "Sudden weakness, slurred speech, or facial drooping may be signs of a stroke. Time matters.",
    actions: [
      "Call 112 (national emergency) now.",
      "Call 108 (ambulance) for immediate transport.",
      "Note the time symptoms started — this is critical for treatment.",
      "Do not give food or drink.",
    ],
  },

  unconscious_seizure: {
    title: "Possible unconsciousness or seizure",
    message:
      "Loss of consciousness or seizure activity requires emergency care.",
    actions: [
      "Call 112 (national emergency) now.",
      "Call 108 (ambulance) for immediate transport.",
      "If the person is breathing, place them on their side (recovery position).",
      "Do not put anything in their mouth.",
    ],
  },

  poisoning: {
    title: "Possible poisoning or envenomation",
    message:
      "Swallowing a harmful substance or a bite/sting can be dangerous. Get emergency help now.",
    actions: [
      "Call 112 (national emergency) now.",
      "Call 108 (ambulance) for immediate transport.",
      "Do not induce vomiting unless a medical professional tells you to.",
      "Keep the container, wrapper, or a photo of the substance/bite for responders.",
    ],
  },

  self_harm: {
    title: "You are not alone",
    message:
      "It sounds like you are going through a very difficult time. Your feelings matter, and help is available right now. Please reach out to someone who can support you.",
    actions: [
      "Call Tele-MANAS at 14416 — a free, confidential mental health helpline in India.",
      "If you are in immediate danger, call 112 (national emergency).",
      "Reach out to a trusted friend, family member, or a local mental health professional.",
      "You deserve support. Please stay safe and talk to someone now.",
    ],
  },
}

export function getEmergencyResponse(
  category: EmergencyCategory
): EmergencyResponse {
  return RESPONSES[category]
}
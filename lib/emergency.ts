// =============================================================================
// CURERA AI — Emergency Detection
//
// Runs BEFORE any LLM call. Pure local function: no network, no AI.
// Returns { isEmergency, category, matchedPhrase }.
//
// Design:
//   - normalize() removes apostrophes first ("can't" -> "cant"), strips other
//     punctuation (keeping Devanagari), collapses spaces. Phrases are
//     normalized the same way at load time.
//   - Text is split into clauses (punctuation + but/however/lekin/...).
//   - Negation and past markers are checked only NEAR the matched symptom.
//   - Voice input has no punctuation, so the checks are word-scoped.
//   - self_harm is NEVER suppressed (fail-safe).
// =============================================================================

import type { EmergencyCategory, EmergencyDetection } from "@/types"

// -----------------------------------------------------------------------------
// Phrase lists (raw; normalized at load)
// -----------------------------------------------------------------------------

const RAW_PHRASES: Record<EmergencyCategory, string[]> = {
  cardiac: [
    "chest pain",
    "chest pressure",
    "chest tightness",
    "heart attack",
    "pain in my chest",
    "pain in the chest",
    "crushing chest",
    "left arm pain",
    "pain radiating to my arm",
    "jaw pain with chest",
    "seene mein dard",
    "seene me dard",
    "chhati mein dard",
    "chhati me dard",
    "dil ka daura",
    "dil mein dard",
    "seene me jalan",
    "seene mein jalan",
    "haath mein dard aur seene mein dard",
  ],
  breathing: [
    "difficulty breathing",
    "trouble breathing",
    "cannot breathe",
    "can't breathe",
    "shortness of breath",
    "gasping for air",
    "choking",
    "suffocating",
    "breathing stopped",
    "not breathing",
    "saans nahi aa rahi",
    "saans nahin aa rahi",
    "saans nahi le pa raha",
    "saans phool rahi",
    "saans phul rahi",
    "dam ghut raha",
    "dum ghut raha",
    "saans ruk gayi",
    "sans nahi aa rahi",
    "sans nahin aa rahi",
  ],
  bleeding: [
    "severe bleeding",
    "heavy bleeding",
    "bleeding a lot",
    "bleeding heavily",
    "blood won't stop",
    "won't stop bleeding",
    "losing a lot of blood",
    "coughing blood",
    "vomiting blood",
    "blood in vomit",
    "blood in stool",
    "khoon beh raha",
    "khoon beh raha hai",
    "bahut khoon",
    "khoon nahi ruk raha",
    "khoon nahin ruk raha",
    "khoon ki ulti",
    "khoon aa raha",
    "khoon nikal raha",
  ],
  stroke: [
    "face drooping",
    "face is drooping",
    "slurred speech",
    "cannot speak",
    "can't speak",
    "sudden weakness on one side",
    "weakness on one side",
    "numbness on one side",
    "sudden confusion",
    "sudden vision loss",
    "loss of vision in one eye",
    "stroke",
    "muh tedha",
    "muh tedha ho gaya",
    "bolne mein dikkat",
    "bol nahi pa raha",
    "bol nahin pa raha",
    "ek taraf kamzori",
    "shareer ka ek hissa sunn",
    "aankh se dikh nahi raha",
    "lakwa",
    "paralysis",
  ],
  unconscious_seizure: [
    "unconscious",
    "passed out",
    "fainted",
    "not responding",
    "seizure",
    "convulsion",
    "having a fit",
    "collapsed",
    "unresponsive",
    "behosh",
    "behosh ho gaya",
    "behosh ho gayi",
    "chakkar aa kar gir gaya",
    "mirgi ka daura",
    "daura pad gaya",
    "jhatke aa rahe",
    "jhatke aa rahe hain",
    "uth nahi raha",
  ],
  poisoning: [
    "swallowed poison",
    "drank poison",
    "took too many pills",
    "overdose",
    "overdosed",
    "swallowed chemicals",
    "drank bleach",
    "drank kerosene",
    "poisoning",
    "toxic substance",
    "snake bite",
    "scorpion sting",
    "dog bite",
    "zeher kha liya",
    "zeher pi liya",
    "zehar kha liya",
    "zehar pi liya",
    "zyada goli kha li",
    "zyada dawa kha li",
    "keetne ne kata",
    "saanp ne kata",
    "saap ne kata",
    "kutte ne kata",
  ],
  self_harm: [
    "want to die",
    "want to end my life",
    "kill myself",
    "suicide",
    "suicidal",
    "end my life",
    "don't want to live",
    "no reason to live",
    "better off dead",
    "hurt myself",
    "self harm",
    "cutting myself",
    "marna chahta",
    "marna chahti",
    "marna chahta hoon",
    "marna chahti hoon",
    "jeena nahi chahta",
    "jeena nahin chahta",
    "khudkushi",
    "khudkhushi",
    "aatmhatya",
    "khud ko hurt",
    "khud ko nuksan",
  ],
}

// -----------------------------------------------------------------------------
// Normalization
// -----------------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['\u2018\u2019\u02BC`]/g, "") // can't -> cant, don't -> dont
    .replace(/[^\w\s\u0900-\u097F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const PHRASES: Record<EmergencyCategory, string[]> = Object.fromEntries(
  (Object.entries(RAW_PHRASES) as [EmergencyCategory, string[]][]).map(
    ([cat, list]) => [
      cat,
      Array.from(new Set(list.map(normalize).filter(Boolean))),
    ]
  )
) as Record<EmergencyCategory, string[]>

// -----------------------------------------------------------------------------
// Clause splitting
// -----------------------------------------------------------------------------

const CLAUSE_WORD_SEPARATORS = [
  "but",
  "however",
  "although",
  "lekin",
  "magar",
  "ab",
]

function splitClauses(raw: string): string[] {
  let text = raw.toLowerCase()

  text = text.replace(/\band now\b/g, " \u0000 ")
  text = text.replace(/[.!?;,\n\r]+/g, " \u0000 ")
  for (const w of CLAUSE_WORD_SEPARATORS) {
    text = text.replace(new RegExp(`\\b${w}\\b`, "g"), " \u0000 ")
  }

  return text
    .split("\u0000")
    .map((c) => normalize(c))
    .filter((c) => c.length > 0)
}

// -----------------------------------------------------------------------------
// Negation (word-scoped; works without punctuation)
// -----------------------------------------------------------------------------

const NEGATION_BEFORE = new Set([
  "no", "not", "never", "without", "denies", "deny",
  "dont", "doesnt", "didnt", "havent", "hasnt",
  "nahi", "nahin", "nhi", "bina",
])
const NEGATION_AFTER = new Set(["nahi", "nahin", "nhi"])

// Words allowed BETWEEN a negation word and the symptom ("no severe chest pain").
// Anything else ("no fever chest pain") breaks the negation, so we fail safe.
const NEGATION_FILLERS = new Set([
  "have", "has", "had", "any", "much", "a", "an", "the", "my", "of",
  "really", "very", "too", "severe", "sudden", "mild", "heavy", "bad",
  "serious", "major", "real", "current", "more", "possible",
])

function isNegated(clause: string, matchStart: number, matchEnd: number): boolean {
  const beforeText = clause.slice(0, matchStart).trim()
  const beforeWords = beforeText ? beforeText.split(" ") : []

  let i = beforeWords.length - 1
  let skipped = 0
  while (i >= 0 && skipped < 4 && NEGATION_FILLERS.has(beforeWords[i])) {
    i--
    skipped++
  }
  if (i >= 0 && NEGATION_BEFORE.has(beforeWords[i])) return true

  const afterText = clause.slice(matchEnd).trim()
  const afterWords = afterText ? afterText.split(" ") : []
  return afterWords.slice(0, 2).some((w) => NEGATION_AFTER.has(w))
}

// -----------------------------------------------------------------------------
// Past / resolved markers (only NEAR the symptom)
// -----------------------------------------------------------------------------

const PAST_BEFORE = [
  "used to", "history of", "previously", "in the past",
  "no longer", "pehle", "pahle",
]
const PAST_AFTER = [
  "last year", "last month", "last week", "years ago", "year ago",
  "months ago", "month ago", "weeks ago", "week ago", "previously",
  "in the past", "no longer", "resolved", "thik ho gaya", "theek ho gaya",
]

function hasWords(text: string, marker: string): boolean {
  return ` ${text} `.includes(` ${marker} `)
}

function isPast(clause: string, matchStart: number, matchEnd: number): boolean {
  const before = clause.slice(0, matchStart).trim().split(" ").slice(-4).join(" ")
  const after = clause.slice(matchEnd).trim().split(" ").slice(0, 4).join(" ")
  return (
    PAST_BEFORE.some((m) => hasWords(before, m)) ||
    PAST_AFTER.some((m) => hasWords(after, m))
  )
}

// -----------------------------------------------------------------------------
// Phrase matching (all occurrences, word boundary at start)
// -----------------------------------------------------------------------------

function findAllPhraseStarts(clause: string, phrase: string): number[] {
  const positions: number[] = []
  let start = 0
  while (start <= clause.length - phrase.length) {
    const idx = clause.indexOf(phrase, start)
    if (idx === -1) break
    if (idx === 0 || clause[idx - 1] === " ") positions.push(idx)
    start = idx + 1
  }
  return positions
}

// self_harm first so it is never suppressed
const CATEGORY_ORDER: EmergencyCategory[] = [
  "self_harm",
  "cardiac",
  "breathing",
  "bleeding",
  "stroke",
  "unconscious_seizure",
  "poisoning",
]

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function detectEmergency(text: string): EmergencyDetection {
  const noMatch: EmergencyDetection = {
    isEmergency: false,
    category: null,
    matchedPhrase: null,
  }
  if (!text || !text.trim()) return noMatch

  const clauses = splitClauses(text)

  for (const category of CATEGORY_ORDER) {
    for (const clause of clauses) {
      for (const phrase of PHRASES[category]) {
        for (const pos of findAllPhraseStarts(clause, phrase)) {
          const end = pos + phrase.length
          if (category !== "self_harm") {
            if (isNegated(clause, pos, end)) continue
            if (isPast(clause, pos, end)) continue
          }
          return { isEmergency: true, category, matchedPhrase: phrase }
        }
      }
    }
  }

  return noMatch
}
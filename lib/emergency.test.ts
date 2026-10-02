import { describe, it, expect } from "vitest"
import { detectEmergency } from "@/lib/emergency"

describe("detectEmergency", () => {
  // ---------------------------------------------------------------------------
  // True positives — cardiac
  // ---------------------------------------------------------------------------
  it("detects 'chest pain' (cardiac)", () => {
    const r = detectEmergency("I am having chest pain right now")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
    expect(r.matchedPhrase).toBe("chest pain")
  })

  it("detects 'chest pressure' (cardiac)", () => {
    expect(detectEmergency("sudden chest pressure").category).toBe("cardiac")
  })

  it("detects 'heart attack' (cardiac)", () => {
    expect(detectEmergency("I think I am having a heart attack").category).toBe("cardiac")
  })

  it("detects Hinglish 'seene mein dard' (cardiac)", () => {
    expect(detectEmergency("seene mein dard ho raha hai").category).toBe("cardiac")
  })

  it("detects Hinglish 'dil ka daura' (cardiac)", () => {
    expect(detectEmergency("mujhe dil ka daura aa raha hai").category).toBe("cardiac")
  })

  // ---------------------------------------------------------------------------
  // True positives — breathing
  // ---------------------------------------------------------------------------
  it("detects 'difficulty breathing' (breathing)", () => {
    expect(detectEmergency("I have difficulty breathing").category).toBe("breathing")
  })

  it("detects \"can't breathe\" (breathing)", () => {
    expect(detectEmergency("I can't breathe properly").category).toBe("breathing")
  })

  it("detects 'shortness of breath' (breathing)", () => {
    expect(detectEmergency("experiencing shortness of breath").category).toBe("breathing")
  })

  it("detects Hinglish 'saans nahi aa rahi' (breathing)", () => {
    expect(detectEmergency("saans nahi aa rahi hai").category).toBe("breathing")
  })

  it("detects Hinglish 'dam ghut raha' (breathing)", () => {
    expect(detectEmergency("dam ghut raha hai").category).toBe("breathing")
  })

  // ---------------------------------------------------------------------------
  // True positives — bleeding
  // ---------------------------------------------------------------------------
  it("detects 'severe bleeding' (bleeding)", () => {
    expect(detectEmergency("severe bleeding from my hand").category).toBe("bleeding")
  })

  it("detects 'bleeding a lot' (bleeding)", () => {
    expect(detectEmergency("bleeding a lot from the wound").category).toBe("bleeding")
  })

  it("detects 'vomiting blood' (bleeding)", () => {
    expect(detectEmergency("I am vomiting blood").category).toBe("bleeding")
  })

  it("detects Hinglish 'khoon beh raha' (bleeding)", () => {
    expect(detectEmergency("khoon beh raha hai ruk nahi raha").category).toBe("bleeding")
  })

  it("detects Hinglish 'bahut khoon' (bleeding)", () => {
    expect(detectEmergency("bahut khoon nikal raha hai").category).toBe("bleeding")
  })

  // ---------------------------------------------------------------------------
  // True positives — stroke
  // ---------------------------------------------------------------------------
  it("detects 'slurred speech' (stroke)", () => {
    expect(detectEmergency("slurred speech since morning").category).toBe("stroke")
  })

  it("detects 'face drooping' (stroke)", () => {
    expect(detectEmergency("face drooping on the left side").category).toBe("stroke")
  })

  it("detects 'sudden weakness on one side' (stroke)", () => {
    expect(detectEmergency("sudden weakness on one side of my body").category).toBe("stroke")
  })

  it("detects Hinglish 'muh tedha' (stroke)", () => {
    expect(detectEmergency("muh tedha ho gaya hai").category).toBe("stroke")
  })

  it("detects Hinglish 'lakwa' (stroke)", () => {
    expect(detectEmergency("lakwa ho gaya hai").category).toBe("stroke")
  })

  // ---------------------------------------------------------------------------
  // True positives — unconscious_seizure
  // ---------------------------------------------------------------------------
  it("detects 'unconscious' (unconscious_seizure)", () => {
    expect(detectEmergency("he is unconscious").category).toBe("unconscious_seizure")
  })

  it("detects 'seizure' (unconscious_seizure)", () => {
    expect(detectEmergency("she had a seizure").category).toBe("unconscious_seizure")
  })

  it("detects 'passed out' (unconscious_seizure)", () => {
    expect(detectEmergency("my father passed out").category).toBe("unconscious_seizure")
  })

  it("detects Hinglish 'behosh' (unconscious_seizure)", () => {
    expect(detectEmergency("woh behosh ho gaya").category).toBe("unconscious_seizure")
  })

  it("detects Hinglish 'mirgi ka daura' (unconscious_seizure)", () => {
    expect(detectEmergency("mirgi ka daura pad gaya").category).toBe("unconscious_seizure")
  })

  // ---------------------------------------------------------------------------
  // True positives — poisoning
  // ---------------------------------------------------------------------------
  it("detects 'overdose' (poisoning)", () => {
    expect(detectEmergency("I think I took an overdose").category).toBe("poisoning")
  })

  it("detects 'drank poison' (poisoning)", () => {
    expect(detectEmergency("she accidentally drank poison").category).toBe("poisoning")
  })

  it("detects Hinglish 'zeher kha liya' (poisoning)", () => {
    expect(detectEmergency("usne zeher kha liya").category).toBe("poisoning")
  })

  it("detects Hinglish 'saanp ne kata' (poisoning)", () => {
    expect(detectEmergency("saanp ne kata hai").category).toBe("poisoning")
  })

  // ---------------------------------------------------------------------------
  // True positives — self_harm
  // ---------------------------------------------------------------------------
  it("detects 'want to die' (self_harm)", () => {
    const r = detectEmergency("I want to die")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("self_harm")
  })

  it("detects 'kill myself' (self_harm)", () => {
    expect(detectEmergency("I want to kill myself").category).toBe("self_harm")
  })

  it("detects 'suicidal' (self_harm)", () => {
    expect(detectEmergency("I have been feeling suicidal").category).toBe("self_harm")
  })

  it("detects Hinglish 'marna chahta hoon' (self_harm)", () => {
    expect(detectEmergency("main marna chahta hoon").category).toBe("self_harm")
  })

  it("detects Hinglish 'khudkushi' (self_harm)", () => {
    expect(detectEmergency("khudkushi karne ka mann karta hai").category).toBe("self_harm")
  })

  // ---------------------------------------------------------------------------
  // Negations — must NOT trigger
  // ---------------------------------------------------------------------------
  it("negation: 'no chest pain' is not emergency", () => {
    const r = detectEmergency("I have no chest pain")
    expect(r.isEmergency).toBe(false)
  })

  it("negation: 'don't have trouble breathing' is not emergency", () => {
    const r = detectEmergency("I don't have trouble breathing")
    expect(r.isEmergency).toBe(false)
  })

  it("negation: 'no difficulty breathing' is not emergency", () => {
    const r = detectEmergency("no difficulty breathing at all")
    expect(r.isEmergency).toBe(false)
  })

  it("negation: 'denies chest pressure' is not emergency", () => {
    const r = detectEmergency("patient denies chest pressure")
    expect(r.isEmergency).toBe(false)
  })

  it("negation: Hinglish 'saans nahi phool rahi nahi' is not emergency", () => {
    // "saans nahi phool rahi" — the negation marker "nahi" appears before
    const r = detectEmergency("saans nahi phool rahi hai")
    expect(r.isEmergency).toBe(false)
  })

  it("negation: 'without chest tightness' is not emergency", () => {
    const r = detectEmergency("without chest tightness")
    expect(r.isEmergency).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Past / resolved — must NOT trigger
  // ---------------------------------------------------------------------------
  it("past: 'chest pain last year' is not emergency", () => {
    const r = detectEmergency("I had chest pain last year")
    expect(r.isEmergency).toBe(false)
  })

  it("past: 'severe bleeding months ago' is not emergency", () => {
    const r = detectEmergency("severe bleeding months ago, now fine")
    expect(r.isEmergency).toBe(false)
  })

  it("past: 'seizure years ago' is not emergency", () => {
    const r = detectEmergency("I had a seizure years ago")
    expect(r.isEmergency).toBe(false)
  })

  it("past: 'pehle seene mein dard tha' is not emergency", () => {
    const r = detectEmergency("pehle seene mein dard tha, ab nahi")
    expect(r.isEmergency).toBe(false)
  })

  it("past: 'used to have shortness of breath' is not emergency", () => {
    const r = detectEmergency("I used to have shortness of breath")
    expect(r.isEmergency).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Normal everyday sentences — must NOT trigger
  // ---------------------------------------------------------------------------
  it("normal: headache for three days", () => {
    const r = detectEmergency("I have had a mild headache for three days")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: mild rash on arms", () => {
    const r = detectEmergency("I have a mild rash on my arms")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: stomach ache after eating", () => {
    const r = detectEmergency("I have a stomach ache after eating")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: sore throat and runny nose", () => {
    const r = detectEmergency("sore throat and runny nose since yesterday")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: back pain from sitting long", () => {
    const r = detectEmergency("my back hurts from sitting too long")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: Hinglish 'pet dard' (stomach ache)", () => {
    const r = detectEmergency("pet mein dard ho raha hai")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: Hinglish 'bukhar' (fever)", () => {
    const r = detectEmergency("kal se bukhar aa raha hai")
    expect(r.isEmergency).toBe(false)
  })

  it("normal: Hinglish 'khansi' (cough)", () => {
    const r = detectEmergency("khansi aur zukaam hai")
    expect(r.isEmergency).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Empty / whitespace
  // ---------------------------------------------------------------------------
  it("empty string returns no emergency", () => {
    const r = detectEmergency("")
    expect(r.isEmergency).toBe(false)
    expect(r.category).toBeNull()
    expect(r.matchedPhrase).toBeNull()
  })

  it("whitespace only returns no emergency", () => {
    const r = detectEmergency("   \n\t  ")
    expect(r.isEmergency).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Punctuation handling
  // ---------------------------------------------------------------------------
  it("detects emergency despite punctuation", () => {
    const r = detectEmergency("I have chest-pain!!!")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
  })

  it("detects Hinglish despite punctuation", () => {
    const r = detectEmergency("seene mein dard, saans nahi aa rahi...")
    expect(r.isEmergency).toBe(true)
    // self_harm checked first, then cardiac; "seene mein dard" matches cardiac
    expect(r.category).toBe("cardiac")
  })
  // ---------------------------------------------------------------------------
  // Regression tests
  // ---------------------------------------------------------------------------
  it("regression: \"I can't breathe properly\" → breathing", () => {
    const r = detectEmergency("I can't breathe properly")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("breathing")
  })

  it("regression: \"I don't want to live\" → self_harm", () => {
    const r = detectEmergency("I don't want to live")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("self_harm")
  })

  it("regression: \"I don't have trouble breathing\" → not emergency", () => {
    expect(detectEmergency("I don't have trouble breathing").isEmergency).toBe(false)
  })

  it("regression: 'no appetite and severe chest pain' → cardiac", () => {
    const r = detectEmergency("I have no appetite and severe chest pain")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
  })

  it("regression: 'no fever, chest pain since morning' → cardiac", () => {
    const r = detectEmergency("I have no fever, chest pain since morning")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
  })

  it("regression: 'cold last week and now can't breathe' → breathing", () => {
    const r = detectEmergency("I had a cold last week and now I can't breathe")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("breathing")
  })

  it("regression: 'chest pain last year but again today' → cardiac", () => {
    const r = detectEmergency("I had chest pain last year but I have chest pain again today")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
  })

  it("regression: 'no chest pain earlier but now chest pain' → cardiac", () => {
    const r = detectEmergency("no chest pain earlier but now chest pain")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
  })

  it("regression: 'seene mein dard nahi hai' → not emergency", () => {
    expect(detectEmergency("seene mein dard nahi hai").isEmergency).toBe(false)
  })

  it("regression: 'saans nahi aa rahi hai' → breathing", () => {
    const r = detectEmergency("saans nahi aa rahi hai")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("breathing")
  })

  it("regression: 'the fitting room was crowded' → not emergency", () => {
    expect(detectEmergency("the fitting room was crowded").isEmergency).toBe(false)
  })

  it("regression: 'benefitting from the new medicine' → not emergency", () => {
    expect(detectEmergency("she is benefitting from the new medicine").isEmergency).toBe(false)
  })

  it("regression: 'I had a seizure years ago' → not emergency", () => {
    expect(detectEmergency("I had a seizure years ago").isEmergency).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Voice input: no punctuation
  // ---------------------------------------------------------------------------
  it("voice: no punctuation, 'no fever chest pain' → cardiac", () => {
    const r = detectEmergency("i have no fever chest pain since morning")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("cardiac")
  })

  it("voice: no punctuation, past cold then can't breathe → breathing", () => {
    const r = detectEmergency("i had a cold last week i cant breathe")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("breathing")
  })

  it("voice: 'not okay i want to die' is never suppressed → self_harm", () => {
    const r = detectEmergency("i am not okay i want to die")
    expect(r.isEmergency).toBe(true)
    expect(r.category).toBe("self_harm")
  })
})
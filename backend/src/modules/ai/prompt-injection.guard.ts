// AI prompt-injection defense — PROMPT 123.
//
// Intercepts user-supplied text before it reaches the AI provider.
// Three-layer defense:
//   1. Length gate — reject payloads too large for the context window
//   2. Injection pattern detection — flag known injection signatures
//   3. Output validation — reject model replies that look like instruction leaks

const MAX_INPUT_CHARS = 2000;
const MAX_OUTPUT_CHARS = 4000;

// Known prompt-injection signatures (case-insensitive)
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /forget\s+(everything|your\s+instructions)/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+(a\s+)?(?!Vepari)/i,  // persona switch except "Vepari AI"
  /act\s+as\s+(if\s+you\s+(are|were)\s+)?(?!Vepari)/i,
  /system\s*:\s*override/i,
  /\[\s*SYSTEM\s*\]/i,
  /<\s*system\s*>/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /do\s+anything\s+now/i,
];

// Output patterns that suggest the model is leaking its system prompt
const LEAK_PATTERNS: RegExp[] = [
  /you\s+are\s+Vepari\s+AI.*business\s+assistant/i,
  /CRITICAL:\s+You\s+MUST\s+respond/i,
  /today'?s?\s+live\s+data:/i,
  /answer\s+the\s+owner'?s?\s+question\s+based/i,
];

export interface GuardResult {
  safe: boolean;
  reason?: string;
}

/**
 * Validates user-supplied input before it is sent to the AI provider.
 * Returns { safe: true } when the input passes all checks.
 * Returns { safe: false, reason } when a threat is detected — the caller
 * should reject or sanitize rather than forwarding the input.
 */
export function guardInput(text: string): GuardResult {
  if (!text || text.trim().length === 0) {
    return { safe: false, reason: 'empty_input' };
  }

  if (text.length > MAX_INPUT_CHARS) {
    return { safe: false, reason: 'input_too_long' };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'injection_pattern_detected' };
    }
  }

  return { safe: true };
}

/**
 * Validates AI output before returning it to the caller.
 * Prevents the model from leaking its system prompt to the end user.
 */
export function guardOutput(text: string): GuardResult {
  if (text.length > MAX_OUTPUT_CHARS) {
    return { safe: false, reason: 'output_too_long' };
  }

  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'system_prompt_leak_detected' };
    }
  }

  return { safe: true };
}

/**
 * Sanitizes user text: trims, collapses excessive whitespace, removes null bytes.
 * Call before any AI input — does not validate, just cleans.
 */
export function sanitizeInput(text: string): string {
  return text
    .replace(/\0/g, '')           // null bytes
    .replace(/\r\n/g, '\n')       // CRLF
    .replace(/\t/g, ' ')          // tabs
    .replace(/ {3,}/g, '  ')      // excessive spaces
    .trim()
    .slice(0, MAX_INPUT_CHARS);
}

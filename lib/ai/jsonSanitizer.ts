/**
 * Robust JSON Parser & Sanitizer for LLM outputs.
 * Handles:
 * 1. Markdown code blocks (```json ... ```)
 * 2. Unescaped control characters (literal newlines, tabs) inside JSON string values
 * 3. Trailing commas before closing braces/brackets
 * 4. Truncated JSON caused by token limits (auto-closes quotes, arrays, objects)
 */

export function safeParseLLMJson<T = any>(rawText: string): T | null {
  if (!rawText || typeof rawText !== 'string') return null;

  let text = rawText.trim();

  // 1. Strip markdown code fences if present
  if (text.includes('```')) {
    text = text
      .replace(/^```(?:json)?\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim();
  }

  // 2. Find start of JSON object or array
  const firstBrace = text.indexOf('{');
  const firstSquare = text.indexOf('[');
  let startIndex = -1;

  if (firstBrace !== -1 && firstSquare !== -1) {
    startIndex = Math.min(firstBrace, firstSquare);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstSquare !== -1) {
    startIndex = firstSquare;
  }

  if (startIndex === -1) return null;

  let jsonStr = text.substring(startIndex);

  // Attempt 1: Direct parse
  let parsed = tryParseJson<T>(jsonStr);
  if (parsed !== null) return parsed;

  // Attempt 2: If there's a matching last brace/bracket, try parsing up to that
  const lastBrace = Math.max(jsonStr.lastIndexOf('}'), jsonStr.lastIndexOf(']'));
  if (lastBrace !== -1) {
    const closedSegment = jsonStr.substring(0, lastBrace + 1);
    parsed = tryParseJson<T>(closedSegment);
    if (parsed !== null) return parsed;

    // Try sanitizing unescaped control chars in the closed segment
    const sanitizedSegment = sanitizeJsonStringLiterals(closedSegment);
    parsed = tryParseJson<T>(sanitizedSegment);
    if (parsed !== null) return parsed;
  }

  // Attempt 3: Sanitize unescaped control characters (newlines/tabs) inside strings in the full string
  const sanitizedStr = sanitizeJsonStringLiterals(jsonStr);
  parsed = tryParseJson<T>(sanitizedStr);
  if (parsed !== null) return parsed;

  // Attempt 4: Repair truncated JSON (unclosed string quotes, arrays, braces)
  const repairedStr = repairTruncatedJson(sanitizedStr);
  parsed = tryParseJson<T>(repairedStr);
  if (parsed !== null) return parsed;

  // Attempt 5: Fallback regex to extract "response" field if partial JSON structure exists
  const responseMatch = rawText.match(/"response"\s*:\s*"((?:[^"\\]|[\s\S])*?)"/);
  if (responseMatch && responseMatch[1]) {
    try {
      const extractedResponse = JSON.parse(`"${responseMatch[1]}"`);
      return { response: extractedResponse, action: null } as unknown as T;
    } catch {
      return { response: responseMatch[1], action: null } as unknown as T;
    }
  }

  return null;
}

function tryParseJson<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    // Try removing trailing commas e.g. ,} or ,]
    try {
      const fixedCommas = str.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixedCommas) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Escapes unescaped control characters (raw newlines, carriage returns, tabs)
 * that appear inside double-quoted string literals in JSON.
 */
function sanitizeJsonStringLiterals(str: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inString) {
      if (isEscaped) {
        result += char;
        isEscaped = false;
      } else if (char === '\\') {
        result += char;
        isEscaped = true;
      } else if (char === '"') {
        result += char;
        inString = false;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      result += char;
      if (char === '"') {
        inString = true;
      }
    }
  }

  return result;
}

/**
 * Repairs truncated JSON strings by closing unclosed string quotes, array brackets, and object braces.
 */
function repairTruncatedJson(str: string): string {
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        if (stack.length > 0) {
          const top = stack[stack.length - 1];
          if ((char === '}' && top === '{') || (char === ']' && top === '[')) {
            stack.pop();
          }
        }
      }
    }
  }

  let repaired = str;

  // If inside a string, close quote
  if (inString) {
    if (isEscaped) {
      repaired = repaired.slice(0, -1);
    }
    repaired += '"';
  }

  // Remove trailing colon, comma, or whitespace before closing structures
  repaired = repaired.replace(/[:,\s]+$/, '');

  // Close remaining open brackets and braces in reverse order
  while (stack.length > 0) {
    const openChar = stack.pop();
    if (openChar === '{') repaired += '}';
    else if (openChar === '[') repaired += ']';
  }

  return repaired;
}

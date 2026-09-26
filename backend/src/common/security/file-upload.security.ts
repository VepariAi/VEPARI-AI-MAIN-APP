// File upload security — PROMPT 203.
//
// Validates uploads defense-in-depth: size gate, extension allowlist, declared
// MIME allowlist, and — critically — a magic-byte (file signature) check so a
// malicious file cannot bypass validation by lying about its extension or
// Content-Type. Only the document/image types the app actually accepts are
// permitted; everything else is rejected.

export interface UploadCandidate {
  filename: string;
  mimeType: string;
  size: number;
  /** First bytes of the file — enough to read the signature (>= 16 bytes ideal). */
  head: Uint8Array;
}

export interface UploadValidationResult {
  ok: boolean;
  reason?: string;
  detectedType?: string;
}

// 10 MB — covers scanned invoices/photos; anything larger is rejected.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface TypeSpec {
  ext: string[];
  mime: string[];
  // Magic-byte prefixes; any match confirms the type. Empty = signature not checked.
  signatures: number[][];
}

const ALLOWED_TYPES: Record<string, TypeSpec> = {
  jpeg: { ext: ['jpg', 'jpeg'], mime: ['image/jpeg'], signatures: [[0xff, 0xd8, 0xff]] },
  png: { ext: ['png'], mime: ['image/png'], signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  webp: {
    ext: ['webp'],
    mime: ['image/webp'],
    // "RIFF" .... "WEBP" — check RIFF prefix; WEBP tag sits at offset 8.
    signatures: [[0x52, 0x49, 0x46, 0x46]],
  },
  pdf: { ext: ['pdf'], mime: ['application/pdf'], signatures: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
};

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
}

function matchesSignature(head: Uint8Array, signature: number[]): boolean {
  if (head.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (head[i] !== signature[i]) return false;
  }
  return true;
}

function detectType(head: Uint8Array): string | null {
  for (const [name, spec] of Object.entries(ALLOWED_TYPES)) {
    if (spec.signatures.length === 0) continue;
    if (spec.signatures.some(sig => matchesSignature(head, sig))) {
      // WebP needs the WEBP tag at offset 8 in addition to RIFF.
      if (name === 'webp') {
        const tag = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
        const ok = head.length >= 12 && tag.every((b, i) => head[8 + i] === b);
        if (!ok) continue;
      }
      return name;
    }
  }
  return null;
}

/**
 * Validate an upload candidate. Returns { ok: true, detectedType } when every
 * layer agrees; otherwise { ok: false, reason }.
 */
export function validateUpload(candidate: UploadCandidate): UploadValidationResult {
  const { filename, mimeType, size, head } = candidate;

  if (!filename || filename.trim().length === 0) {
    return { ok: false, reason: 'missing_filename' };
  }
  // Reject path traversal / directory components in the filename.
  if (/[\\/]/.test(filename) || filename.includes('..')) {
    return { ok: false, reason: 'invalid_filename' };
  }
  if (size <= 0) {
    return { ok: false, reason: 'empty_file' };
  }
  if (size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: 'file_too_large' };
  }

  const ext = extensionOf(filename);
  if (!ext) {
    return { ok: false, reason: 'missing_extension' };
  }

  const specForExt = Object.entries(ALLOWED_TYPES).find(([, s]) => s.ext.includes(ext));
  if (!specForExt) {
    return { ok: false, reason: 'extension_not_allowed' };
  }
  const [typeName, spec] = specForExt;

  if (!spec.mime.includes(mimeType)) {
    return { ok: false, reason: 'mime_mismatch' };
  }

  const detected = detectType(head);
  if (!detected) {
    return { ok: false, reason: 'unrecognized_content' };
  }
  if (detected !== typeName) {
    // Extension says one thing, bytes say another — classic spoof attempt.
    return { ok: false, reason: 'content_extension_mismatch', detectedType: detected };
  }

  return { ok: true, detectedType: detected };
}

/** Allowed extensions (for surfacing in API error messages / UI hints). */
export function allowedExtensions(): string[] {
  return Object.values(ALLOWED_TYPES).flatMap(s => s.ext);
}

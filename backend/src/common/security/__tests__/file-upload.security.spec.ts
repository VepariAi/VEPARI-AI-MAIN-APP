// Unit tests for file upload security — PROMPT 203.

import { validateUpload, allowedExtensions, MAX_UPLOAD_BYTES, type UploadCandidate } from '../file-upload.security';

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIG = [0xff, 0xd8, 0xff, 0xe0];
const PDF_SIG = [0x25, 0x50, 0x44, 0x46, 0x2d];

function candidate(over: Partial<UploadCandidate>): UploadCandidate {
  return {
    filename: 'invoice.png',
    mimeType: 'image/png',
    size: 1024,
    head: new Uint8Array(PNG_SIG),
    ...over,
  };
}

describe('validateUpload', () => {
  it('accepts a valid PNG', () => {
    const r = validateUpload(candidate({}));
    expect(r.ok).toBe(true);
    expect(r.detectedType).toBe('png');
  });

  it('accepts a valid JPEG', () => {
    const r = validateUpload(candidate({ filename: 'photo.jpg', mimeType: 'image/jpeg', head: new Uint8Array(JPEG_SIG) }));
    expect(r.ok).toBe(true);
    expect(r.detectedType).toBe('jpeg');
  });

  it('accepts a valid PDF', () => {
    const r = validateUpload(candidate({ filename: 'gst.pdf', mimeType: 'application/pdf', head: new Uint8Array(PDF_SIG) }));
    expect(r.ok).toBe(true);
    expect(r.detectedType).toBe('pdf');
  });

  it('rejects an empty file', () => {
    expect(validateUpload(candidate({ size: 0 })).reason).toBe('empty_file');
  });

  it('rejects a file over the size limit', () => {
    expect(validateUpload(candidate({ size: MAX_UPLOAD_BYTES + 1 })).reason).toBe('file_too_large');
  });

  it('rejects a disallowed extension', () => {
    expect(validateUpload(candidate({ filename: 'malware.exe', mimeType: 'application/octet-stream' })).reason)
      .toBe('extension_not_allowed');
  });

  it('rejects filenames with path traversal', () => {
    expect(validateUpload(candidate({ filename: '../../etc/passwd' })).reason).toBe('invalid_filename');
    expect(validateUpload(candidate({ filename: 'a/b.png' })).reason).toBe('invalid_filename');
  });

  it('rejects a MIME type that does not match the extension', () => {
    expect(validateUpload(candidate({ filename: 'x.png', mimeType: 'image/jpeg' })).reason).toBe('mime_mismatch');
  });

  it('rejects a spoofed extension (png name, jpeg bytes)', () => {
    const r = validateUpload(candidate({ filename: 'x.png', mimeType: 'image/png', head: new Uint8Array(JPEG_SIG) }));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('content_extension_mismatch');
    expect(r.detectedType).toBe('jpeg');
  });

  it('rejects content with no recognizable signature', () => {
    expect(validateUpload(candidate({ head: new Uint8Array([0x00, 0x01, 0x02, 0x03]) })).reason)
      .toBe('unrecognized_content');
  });

  it('rejects a missing filename', () => {
    expect(validateUpload(candidate({ filename: '' })).reason).toBe('missing_filename');
  });

  it('lists allowed extensions', () => {
    const exts = allowedExtensions();
    expect(exts).toContain('png');
    expect(exts).toContain('pdf');
    expect(exts).not.toContain('exe');
  });
});

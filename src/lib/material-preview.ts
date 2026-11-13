import { previewMaterialType } from './material-metadata.ts';

type MaterialPreview = { kind: 'pdf' | 'image' | 'text' | 'video' | 'audio'; mime: string }

const mediaTypes: Record<string, MaterialPreview['kind']> = {
  'video/mp4': 'video', 'video/webm': 'video', 'video/ogg': 'video', 'video/quicktime': 'video',
  'audio/mpeg': 'audio', 'audio/mp4': 'audio', 'audio/ogg': 'audio', 'audio/wav': 'audio',
  'audio/x-wav': 'audio', 'audio/webm': 'audio', 'audio/flac': 'audio', 'audio/aac': 'audio',
}
const extensionTypes: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp',
  txt: 'text/plain', md: 'text/plain', markdown: 'text/plain', csv: 'text/plain', json: 'text/plain', log: 'text/plain',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac',
}

export function resolveMaterialPreview({ name, type }: { name: string; type: string }): MaterialPreview | null {
  let mime = type.toLowerCase().split(';')[0].trim()
  // Use extensions only when the browser did not provide a specific type.
  if (!mime || mime === 'application/octet-stream') {
    mime = extensionTypes[name.split('.').pop()?.toLowerCase() ?? ''] ?? ''
  }
  if (mime === 'text/markdown' || mime === 'text/csv' || mime === 'application/json') mime = 'text/plain'
  if (mediaTypes[mime]) return { kind: mediaTypes[mime], mime }
  if (!previewMaterialType(mime)) return null
  return { kind: mime === 'application/pdf' ? 'pdf' : mime === 'text/plain' ? 'text' : 'image', mime }
}

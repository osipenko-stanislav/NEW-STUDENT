export type FileKind = 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'markdown' | 'text' | 'image' | 'video' | 'audio' | 'code' | 'unknown'

const extensions: Record<string, FileKind> = {
  pdf: 'pdf', doc: 'document', docx: 'document', xls: 'spreadsheet', xlsx: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', md: 'markdown', markdown: 'markdown', txt: 'text',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', avif: 'image', svg: 'image', bmp: 'image', heic: 'image',
  mp4: 'video', mov: 'video', webm: 'video', avi: 'video', mkv: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio', flac: 'audio', aac: 'audio',
  ipynb: 'code', py: 'code', js: 'code', ts: 'code', json: 'code', html: 'code', css: 'code',
}
const mimeTypes: Record<string, FileKind> = {
  'application/pdf': 'pdf', 'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'spreadsheet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'application/vnd.ms-powerpoint': 'presentation', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'presentation',
  'text/markdown': 'markdown', 'text/x-markdown': 'markdown', 'application/x-ipynb+json': 'code',
}

export function fileKind({ name, type = '' }: { name: string; type?: string }): FileKind {
  const mime = type.toLowerCase().split(';')[0].trim()
  if (mimeTypes[mime]) return mimeTypes[mime]
  for (const category of ['image', 'video', 'audio'] as const) {
    if (mime.startsWith(`${category}/`)) return category
  }
  // Browsers often report MD and notebooks as plain text or generic binary data.
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  return extensions[extension] ?? (mime === 'text/plain' ? 'text' : 'unknown')
}

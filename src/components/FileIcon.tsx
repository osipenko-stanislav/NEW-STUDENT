import { AudioLines, File, FileCode2, FileText, FileType, FileX, Film, Image, Presentation, ScrollText, Sheet, type LucideIcon } from 'lucide-react'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { fileKind, type FileKind } from '@/lib/file-kind'

const icons: Record<FileKind, LucideIcon> = {
  pdf: FileText, document: FileType, spreadsheet: Sheet, presentation: Presentation,
  markdown: FileCode2, text: ScrollText, image: Image, video: Film, audio: AudioLines, code: FileCode2, unknown: File,
}

export default function FileIcon({ name, type, unavailable = false, size = 'default' }: {
  name: string; type?: string; unavailable?: boolean; size?: 'default' | 'compact'
}) {
  const kind = unavailable ? 'unknown' : fileKind({ name, type })
  return <SemanticIcon icon={unavailable ? FileX : icons[kind]} className="file-icon" data-file-kind={kind} size={size} />
}

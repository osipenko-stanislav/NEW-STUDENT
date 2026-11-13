import { useEffect, useState } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import FileIcon from '@/components/FileIcon'
import { Button } from '@/components/ui/button'
import { resolveMaterialPreview } from '@/lib/material-preview'
import type { MaterialLibrary } from '@/lib/material-library'

type PreviewState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; url: string }
  | { status: 'text'; text: string; truncated: boolean }
const textPreviewLimit = 256 * 1024

export default function FilePreview({ material, library, sourceUrl }: { material: { id: string; name: string; type: string }; library?: MaterialLibrary; sourceUrl?: string }) {
  const preview = resolveMaterialPreview(material)
  const kind = preview?.kind
  const mime = preview?.mime
  const [state, setState] = useState<PreviewState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!kind || !mime) return
    let cancelled = false
    let objectUrl: string | undefined
    setState({ status: 'loading' })
    async function load() {
      try {
        const blob = sourceUrl ? await fetch(sourceUrl).then(response => {
          if (!response.ok) throw new Error('File unavailable')
          return response.blob()
        }) : await library?.read(material.id)
        if (cancelled) return
        if (!blob) { setState({ status: 'error' }); return }
        if (kind === 'text') {
          const text = await blob.slice(0, textPreviewLimit).text()
          if (!cancelled) setState({ status: 'text', text, truncated: blob.size > textPreviewLimit })
        } else {
          objectUrl = URL.createObjectURL(new Blob([blob], { type: mime }))
          setState({ status: 'ready', url: objectUrl })
        }
      } catch { if (!cancelled) setState({ status: 'error' }) }
    }
    void load()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [material.id, kind, mime, library, sourceUrl, attempt])

  if (!preview) return <div className="file-preview-message">
    <FileIcon name={material.name} type={material.type} />
    <p>Для этого формата предпросмотр пока недоступен</p>
    <p className="text-muted-foreground">Скачай файл, чтобы открыть его на устройстве.</p>
  </div>
  if (state.status === 'loading') return <div className="file-preview-message" role="status">
    <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />Открываем файл…
  </div>
  if (state.status === 'error') return <div className="file-preview-message" role="alert">
    <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
    <p>Не удалось показать предпросмотр</p>
    <p className="text-muted-foreground">Попробуй еще раз или скачай файл, чтобы открыть его на устройстве.</p>
    <Button type="button" variant="outline" onClick={() => { library?.clearError(); setAttempt(value => value + 1) }}>Повторить</Button>
  </div>
  if (state.status === 'text') return <div className="file-preview-text">
    <pre aria-label={`Содержимое файла: ${material.name}`}>{state.text || 'Файл пуст'}</pre>
    {state.truncated ? <p className="file-preview-notice">Показано начало файла. Скачай его, чтобы прочитать целиком.</p> : null}
  </div>
  const onError = () => setState({ status: 'error' })
  return <div className={`file-preview-media file-preview-${kind}`}>
    {kind === 'image' ? <img src={state.url} alt={material.name} onError={onError} />
      : kind === 'pdf' ? <iframe src={state.url} title={`Просмотр PDF: ${material.name}`} />
        : kind === 'video' ? <video src={state.url} controls playsInline preload="metadata" aria-label={`Просмотр видео: ${material.name}`} onError={onError} />
          : <div className="file-preview-audio-content"><FileIcon name={material.name} type={material.type} />
            <p>{material.name}</p><audio src={state.url} controls preload="metadata" aria-label={`Прослушать: ${material.name}`} onError={onError} />
          </div>}
  </div>
}

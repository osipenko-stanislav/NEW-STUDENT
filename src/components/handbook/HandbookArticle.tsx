import { Fragment, useState, type ReactNode } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { handbookHref, handbookLinkTarget, handbookText, safeHandbookUrl, type HandbookNode } from '@/data/handbook'

type Props = { node: HandbookNode; onOpen: (id: string, anchor?: string) => void }
function ArticleLink({ href, children, onOpen }: { href: string; children: ReactNode; onOpen: Props['onOpen'] }) {
  const target = handbookLinkTarget(href)
  const url = safeHandbookUrl(href)
  if (!url) return <>{children}</>
  return <a href={target ? handbookHref(target.id, target.anchor) : url}
    target={target ? undefined : '_blank'} rel={target ? undefined : 'noopener noreferrer'}
    onClick={event => {
      if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
      event.preventDefault(); onOpen(target.id, target.anchor)
    }}>{children}</a>
}
function ArticleTabs({ node, onOpen }: Props) {
  const tabs = node.content ?? []
  return <Tabs defaultValue={String(tabs[0]?.attrs?.id ?? '0')} className="handbook-source-tabs">
    <TabsList aria-label="Разделы статьи">{tabs.map((tab, i) => <TabsTrigger key={i} value={String(tab.attrs?.id ?? i)}>{String(tab.attrs?.title ?? `Раздел ${i + 1}`)}</TabsTrigger>)}</TabsList>
    {tabs.map((tab, i) => <TabsContent key={i} value={String(tab.attrs?.id ?? i)}><HandbookArticle node={{ type: 'doc', content: tab.content }} onOpen={onOpen} /></TabsContent>)}
  </Tabs>
}
function ArticleMedia({ node }: { node: HandbookNode }) {
  const a = node.attrs ?? {}, meta = (a._meta ?? {}) as { title?: string; simpleType?: string }
  const src = safeHandbookUrl(String(a.src ?? ''))
  const [failed, setFailed] = useState(false)
  if (!src) return null
  if (!failed && (String(a._mimetype).startsWith('image/') || meta.simpleType === 'image')) {
    return <a href={src} target="_blank" rel="noopener noreferrer" className="handbook-image-link"><img src={src} alt={meta.title && !/^image\./.test(meta.title) ? meta.title : 'Иллюстрация к инструкции'} loading="lazy" onError={() => setFailed(true)} /></a>
  }
  return <a className="handbook-file" href={src} target="_blank" rel="noopener noreferrer"><FileText aria-hidden="true" /><span>{meta.title ?? 'Открыть вложение'}</span><ExternalLink aria-hidden="true" /></a>
}
export default function HandbookArticle({ node, onOpen }: Props): ReactNode {
  const a = node.attrs ?? {}
  const children = node.content?.map((child, i) => <HandbookArticle key={String(child.attrs?.id ?? i)} node={child} onOpen={onOpen} />)
  const id = a.id ? `hb-${String(a.id)}` : undefined
  switch (node.type) {
    case 'text': {
      let value: ReactNode = node.text
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') value = <strong>{value}</strong>
        else if (mark.type === 'italic') value = <em>{value}</em>
        else if (mark.type === 'code') value = <code>{value}</code>
        else if (mark.type === 'strike') value = <s>{value}</s>
        else if (mark.type === 'underline') value = <u>{value}</u>
        else if (mark.type === 'subscript') value = <sub>{value}</sub>
        else if (mark.type === 'superscript') value = <sup>{value}</sup>
        else if (mark.type === 'link' && mark.attrs?.href) value = <ArticleLink href={mark.attrs.href} onOpen={onOpen}>{value}</ArticleLink>
      }
      return value
    }
    case 'heading': {
      if (!handbookText(node).trim()) return null
      const level = Math.max(2, Math.min(6, Number(a.level ?? 2)))
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return <Tag id={id} tabIndex={-1}>{children}</Tag>
    }
    case 'paragraph': return <p id={id}>{children}</p>
    case 'hardBreak': return <br />
    case 'horizontal_rule': return <hr />
    case 'bullet_list': return <ul id={id}>{children}</ul>
    case 'ordered_list': return <ol id={id} start={Number(a.start ?? 1)}>{children}</ol>
    case 'list_item': return <li id={id}>{children}</li>
    case 'blockquote': return <blockquote id={id}>{children}</blockquote>
    case 'panel': return <aside id={id} className="handbook-callout">{children}</aside>
    case 'table': return <div className="handbook-table-scroll" tabIndex={0} role="region" aria-label="Таблица"><table id={id}><tbody>{children}</tbody></table></div>
    case 'table_row': return <tr>{children}</tr>
    case 'table_cell': return <td colSpan={Number(a.colspan ?? 1)} rowSpan={Number(a.rowspan ?? 1)}>{children}</td>
    case 'table_header': return <th scope="col" colSpan={Number(a.colspan ?? 1)} rowSpan={Number(a.rowspan ?? 1)}>{children}</th>
    case 'layoutSection': case 'columns': return <div className="handbook-columns">{children}</div>
    case 'layoutColumn': case 'column': return <div className="handbook-column">{children}</div>
    case 'expandSection': {
      const title = node.content?.find(c => c.type === 'expandTitle')
      const body = node.content?.filter(c => c.type !== 'expandTitle')
      return <details id={id} className="handbook-details"><summary>{title ? <HandbookArticle node={title} onOpen={onOpen} /> : 'Подробнее'}</summary><div><HandbookArticle node={{ type: 'doc', content: body }} onOpen={onOpen} /></div></details>
    }
    case 'tabs': return <ArticleTabs node={node} onOpen={onOpen} />
    case 'media': return <ArticleMedia node={node} />
    case 'inlineMath': return <code>{String(a.latex ?? a.formula ?? '')}</code>
    case 'remoteIframe': return <div id={id}>{children}</div>
    case 'remoteIframeTitle': return null
    case 'remoteIframeContent': {
      const src = safeHandbookUrl(String(a.src ?? a.url ?? ''))
      return src ? <div className="handbook-embedded-form"><iframe src={src} title="Форма записи на исследовательский трек" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><ArticleLink href={src} onOpen={onOpen}>Открыть форму в новой вкладке <ExternalLink className="inline size-3" aria-hidden="true" /></ArticleLink></div> : null
    }
    // The source database represents links to child articles; the page renders that list once.
    case 'database': case 'tableOfContents': return null
    default: return <Fragment>{children}</Fragment>
  }
}

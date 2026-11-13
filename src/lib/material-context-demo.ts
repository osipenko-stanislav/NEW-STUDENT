import { academicMaterials } from '../data/academic-data.ts'
import type { ConversationDraft } from '../types/conversation.ts'
import type { ConversationMaterial } from '../types/material.ts'
import type { MockResponse } from './mock-assistant.ts'

// Authored reference responses for the prepared local documents. No file parsing,
// model invocation or inference about arbitrary uploaded files happens here.
export function createMaterialContextResponse(draft: ConversationDraft, materials: readonly ConversationMaterial[]): MockResponse | undefined {
  if (!materials.length || !/кратко|объясни|материал|конспект|разбери|о\s*чем|как проверить|что\s+в/i.test(draft.text)) return
  const known = materials.filter(file => file.sourceAcademicId && academicMaterials.some(item => item.id === file.sourceAcademicId))
  if (!known.length) return { content: [{ type: 'text', text: 'Файл добавлен в контекст разговора и доступен на устройстве. Его содержимое пока не используется в ответах. Могу помочь с учебными материалами курсов, расписанием и домашками.' }], suggestions: ['Материалы', 'Домашки'] }
  const paragraphs = known.slice(0, 3).map(file => {
    const source = academicMaterials.find(item => item.id === file.sourceAcademicId)!
    const focus = source.id === 'validation-guide'
      ? 'Раздели данные на обучающую и проверочную выборки. Настраивай модель только по обучающим данным, а качество оценивай на отложенной части. Это помогает заметить переобучение.'
      : source.id === 'databases-notes'
        ? 'Реляционная модель описывает данные таблицами. Ключи связывают записи, SQL помогает выбрать нужные данные, а индексы ускоряют поиск. Перед запросом определи, какие строки и столбцы нужны.'
        : `${source.description} Начни с основных определений, затем разбери пример и проверь вывод на небольшом наборе данных.`
    const update = (file.academicRevision ?? 1) >= 2 ? '\nПеред практикой сформулируй цель, проверь решение на небольшом примере и запиши вывод.' : ''
    return `«${source.title}»\n${focus}${update}`
  })
  return { content: [{ type: 'text', text: paragraphs.join('\n\n') }],
    attachments: known.map(file => ({ materialId: file.id, name: file.name })),
    suggestions: ['Как проверить решение?', 'Материалы'] }
}

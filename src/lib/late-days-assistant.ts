import type { ConversationDraft } from '../types/conversation.ts'
import type { MockResponse } from './mock-assistant.ts'
import type { LateDaysState } from '../data/late-days.ts'
import type { HomeworkRecord } from './homework-storage.ts'
import { burningTasks, lateDaysBalance } from './late-days.ts'
export function createLateDaysResponse(draft: ConversationDraft, state: LateDaysState, records: Record<string, HomeworkRecord>): MockResponse | undefined {
  const query = (draft.text.trim() || draft.command || '').toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/🔥|[!?.,]/g, '').replace(/\s+/g, ' ').trim()
  const fire = ['я в огне', 'у меня горят дедлайны'].includes(query)
  const rescue = fire || ['перенеси все на день', 'помоги распределить late days', 'какие домашки я могу перенести'].includes(query)
  const mode = rescue ? 'rescue' : ['сколько у меня осталось late days', 'late days'].includes(query) ? 'balance' : query === 'покажи историю late days' ? 'history' : null
  if (!mode) return undefined
  const balance = lateDaysBalance(state)
  const burning = burningTasks(state, records)
  const text = mode === 'rescue' ? !balance.remaining
    ? `${fire ? 'Брат, ща всё поправим! ' : ''}Late Days закончились. Посмотрим домашки и выберем, с чего начать. Продление сейчас недоступно.`
    : !burning.length ? 'В ближайшие 48 часов нет подходящих горящих дедлайнов. Можно спокойно проверить остальные задания.'
      : `${fire ? 'Брат, ща всё поправим! ' : ''}На ближайшие два дня подходящих домашних работ: ${burning.length}. В запасе ${balance.remaining} Late Days. Я подготовил предложение — проверь, какие задания спасаем.`
    : mode === 'history' ? 'Вот расход дней и история переносов. Полная история доступна по кнопке ниже.' : `У тебя осталось ${balance.remaining} Late Days из ${balance.limit}. Это ресурс для переноса дедлайнов, и ты решаешь, как его использовать.`
  return { content: [{ type: 'text', text }, { type: 'late-days', version: 1, mode, planId: crypto.randomUUID(), strategy: query === 'перенеси все на день' ? 'all-one' : query === 'помоги распределить late days' ? 'distribute' : query === 'какие домашки я могу перенести' ? 'manual' : 'burning' }], suggestions: ['Сколько у меня осталось Late Days?', 'Покажи историю Late Days', 'Какие домашки я могу перенести?'] }
}

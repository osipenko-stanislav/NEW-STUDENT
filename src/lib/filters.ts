export const filterOperators = [
  { value: 'is', label: 'равно' },
  { value: 'is-not', label: 'не равно' },
  { value: 'any-of', label: 'одно из' },
  { value: 'none-of', label: 'ни одно из' },
  { value: 'empty', label: 'пусто' },
  { value: 'not-empty', label: 'не пусто' },
] as const
export type FilterOperator = typeof filterOperators[number]['value']
export type FilterCondition = { id: string; field: string; operator: FilterOperator | null; values: string[] }
export type FilterField = { id: string; label: string; options: { value: string; label: string }[] }
export type FilterRecord = Record<string, string | string[] | null | undefined>
export const needsFilterValue = (operator: FilterOperator | null) => operator !== null && operator !== 'empty' && operator !== 'not-empty'
export const isMultipleFilter = (operator: FilterOperator | null) => operator === 'any-of' || operator === 'none-of'
export function filterIsComplete(condition: FilterCondition) {
  return condition.operator !== null && (!needsFilterValue(condition.operator) || condition.values.length > 0)
}
export function matchesFilters(record: FilterRecord, conditions: FilterCondition[]) {
  return conditions.every(condition => {
    if (!filterIsComplete(condition)) return true
    if (!(condition.field in record)) return false
    const raw = record[condition.field]
    const actual = (Array.isArray(raw) ? raw : [raw]).filter((value): value is string => value !== null && value !== undefined && value !== '')
    switch (condition.operator) {
      case 'empty': return actual.length === 0
      case 'not-empty': return actual.length > 0
      case 'is': return actual.includes(condition.values[0])
      case 'is-not': return !actual.includes(condition.values[0])
      case 'any-of': return condition.values.some(value => actual.includes(value))
      case 'none-of': return !condition.values.some(value => actual.includes(value))
      default: return true
    }
  })
}
export function singleFilter(field: string, value: string): FilterCondition[] {
  return value === 'all' ? [] : [{ id: `preset-${field}`, field, operator: 'is', values: [value] }]
}
export function filterOptions(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru')).map(value => ({ value, label: value }))
}

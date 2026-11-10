export type SearchCategory = 'all' | 'courses' | 'materials' | 'homework' | 'sections'

export type SearchItem = {
  id: string
  title: string
  path: string
  category: Exclude<SearchCategory, 'all'>
  icon: string
  section: string
  demo?: boolean
}

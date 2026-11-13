import StudyDownloadSettings from '@/components/StudyDownloadSettings'
import { Children, Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  ArrowDownToLine, Brain, CalendarDays, Check, Clock3, Database, FileJson, FolderOpen,
  Globe, Info, Keyboard, MessageSquare, Monitor, Moon, Palette, RotateCcw, Settings2, ShieldCheck, Sparkles, Sun, Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useDisplayFormats, useSettings } from '@/components/SettingsProvider'
import type { Theme } from '@/components/ThemeSwitcher'
import { appInfo } from '@/data/app-info'
import { formatMaterialSize } from '@/lib/material-metadata'
import { displayDate } from '@/lib/display-formats'
import type { UserSettings } from '@/lib/settings-storage'
import type { Conversation } from '@/types/conversation'
import type { ConversationMaterial } from '@/types/material'

const categories = [
  { id: 'general', title: 'Общие', description: 'Язык, дата и время', icon: Settings2 },
  { id: 'appearance', title: 'Внешний вид', description: 'Тема, текст и анимация', icon: Palette },
  { id: 'input', title: 'Ввод и клавиши', description: 'Отправка и горячие клавиши', icon: Keyboard },
  { id: 'conversations', title: 'Разговоры', description: 'История и удаление', icon: MessageSquare },
  { id: 'memory', title: 'Память', description: 'Предпочтения ассистента', icon: Brain },
  { id: 'library', title: 'Библиотека', description: 'Файлы и локальное хранилище', icon: FolderOpen },
  { id: 'privacy', title: 'Данные и приватность', description: 'Экспорт, очистка и сброс', icon: ShieldCheck },
  { id: 'about', title: 'О приложении', description: 'Версия и возможности', icon: Info },
] as const
type Category = (typeof categories)[number]['id']
type Confirmation = 'history' | 'library' | 'data'
const confirmations = {
  history: { title: 'Очистить историю разговоров?', description: 'Все локальные разговоры и сообщения будут удалены. Файлы останутся в библиотеке. Это действие нельзя отменить.', action: 'Очистить историю' },
  library: { title: 'Очистить библиотеку?', description: 'Все загруженные файлы будут удалены с этого устройства. Разговоры и сообщения останутся, а вложения в них станут недоступны. Это действие нельзя отменить.', action: 'Очистить библиотеку' },
  data: { title: 'Очистить все локальные данные?', description: 'Будут удалены разговоры, файлы, настройки и недавние поисковые переходы NEW STUDENT. Откроется чистый Навигатор. Это действие нельзя отменить.', action: 'Очистить данные' },
}

function SettingRow({ title, description, icon: Icon, children, disabled = false }: {
  title: string; description?: string; icon?: LucideIcon; children: ReactNode; disabled?: boolean
}) {
  return <div className={`settings-row ${disabled ? 'settings-row-disabled' : ''}`}>
    {Icon ? <Icon className="settings-row-icon" aria-hidden="true" /> : null}
    <div className="settings-row-copy"><div className="settings-row-title">{title}</div>
      {description ? <p className="settings-row-description">{description}</p> : null}</div>
    <div className="settings-row-control">{children}</div>
  </div>
}
function SettingsGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const id = useId()
  return <section className="settings-group" aria-labelledby={id}>
    <div className="settings-group-heading"><h3 id={id}>{title}</h3>{description ? <p>{description}</p> : null}</div>
    <Card className="settings-group-card">{Children.toArray(children).map((child, index) => <Fragment key={index}>
      {index > 0 ? <Separator /> : null}{child}
    </Fragment>)}</Card>
  </section>
}
function SettingsSelect({ label, value, options, onChange, disabled = false }: {
  label: string; value: string; options: readonly (readonly [string, string])[]; onChange?: (value: string) => void; disabled?: boolean
}) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger aria-label={label} className="settings-select"><SelectValue /></SelectTrigger>
    <SelectContent>{options.map(([key, title]) => <SelectItem key={key} value={key}>{title}</SelectItem>)}</SelectContent>
  </Select>
}
function KeyHint({ children }: { children: ReactNode }) { return <kbd className="settings-key">{children}</kbd> }

type Props = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  themeError: string | null
  conversations: Conversation[]
  materials: ConversationMaterial[]
  busy: boolean
  storageError: string | null
  onClearHistory: () => boolean | Promise<boolean>
  onClearLibrary: () => Promise<boolean>
  onClearData: () => Promise<boolean>
}

export default function SettingsScreen({ theme, onThemeChange, themeError, conversations, materials, busy, storageError, onClearHistory, onClearLibrary, onClearData }: Props) {
  const { settings, updateSettings, resetSettings, error } = useSettings()
  const { formatDate, formatTime } = useDisplayFormats()
  const [category, setCategory] = useState<Category>('general')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const [quota, setQuota] = useState<number | null>(null)
  const [requesting, setRequesting] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const paneRef = useRef<HTMLElement>(null)
  const active = categories.find(item => item.id === category)!
  const totalSize = materials.reduce((sum, material) => sum + material.size, 0)
  const storageSupported = typeof navigator.storage?.persist === 'function'
  const isBusy = busy || working

  useEffect(() => {
    let cancelled = false
    void navigator.storage?.persisted?.().then(value => { if (!cancelled) setPersistent(value) }).catch(() => {})
    void navigator.storage?.estimate?.().then(value => { if (!cancelled) setQuota(value.quota ?? null) }).catch(() => {})
    return () => { cancelled = true }
  }, [materials.length, totalSize])

  function changeCategory(next: Category) {
    setCategory(next)
    setNotice(null)
    setActionError(null)
    if (paneRef.current) paneRef.current.scrollTop = 0
  }
  function setPreference<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    if (updateSettings({ [key]: value })) setNotice('Настройка сохранена')
  }
  function toggle(key: 'orbAnimation' | 'spellcheck' | 'confirmConversationDeletion', label: string) {
    return <Switch aria-label={label} checked={settings[key]} onCheckedChange={value => setPreference(key, value)} />
  }
  async function confirm() {
    if (!confirmation || isBusy) return
    setWorking(true)
    setActionError(null)
    try {
      const success = await (confirmation === 'history' ? onClearHistory() : confirmation === 'library' ? onClearLibrary() : onClearData())
      if (!success) { setActionError('Не удалось завершить очистку. Проверь доступ к хранилищу браузера и попробуй еще раз.'); return }
      setNotice(confirmation === 'history' ? 'История очищена. Файлы сохранены в библиотеке.' : confirmation === 'library' ? 'Библиотека очищена. Разговоры и сообщения сохранены.' : 'Локальные данные очищены')
      setConfirmation(null)
    } catch { setActionError('Не удалось завершить очистку. Попробуй еще раз.') }
    finally { setWorking(false) }
  }
  async function requestPersistence() {
    setRequesting(true)
    setActionError(null)
    try {
      const allowed = await navigator.storage.persist()
      setPersistent(allowed)
      setNotice(allowed ? 'Браузер разрешил постоянное хранение данных' : 'Браузер не предоставил постоянное хранение. Файлы остаются в локальной библиотеке.')
    } catch { setActionError('Не удалось запросить постоянное хранение. Проверь настройки браузера.') }
    finally { setRequesting(false) }
  }
  function exportHistory() {
    try {
      const blob = new Blob([JSON.stringify({ application: appInfo.name, version: 1, exportedAt: new Date().toISOString(), conversations }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `new-student-history-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('История экспортирована в JSON. Содержимое файлов в экспорт не входит.')
    } catch { setActionError('Не удалось экспортировать историю. Попробуй еще раз.') }
  }

  return <div className="settings-page"><div className="settings-layout">
    <aside className="settings-categories" aria-label="Категории настроек">
      <nav>{categories.map(item => <Button key={item.id} type="button" variant="ghost" className="settings-category"
        aria-current={item.id === category ? 'page' : undefined} onClick={() => changeCategory(item.id)}>
        <item.icon aria-hidden="true" /><span><span className="settings-category-title">{item.title}</span>
</span>
      </Button>)}</nav>
    </aside>
    <div className="settings-mobile-category"><label>Категория настроек</label>
      <SettingsSelect label="Категория настроек" value={category} onChange={value => changeCategory(value as Category)} options={categories.map(item => [item.id, item.title])} />
    </div>
    <section ref={paneRef} className="settings-detail" aria-labelledby="settings-category-title" tabIndex={-1}>
      <div className="settings-detail-inner">
        <header className="settings-detail-heading"><active.icon aria-hidden="true" /><div>
          <h1 id="settings-category-title">{active.title}</h1>
        </div></header>
        {category === 'general' ? <>
          <SettingsGroup title="Язык интерфейса">
            <SettingRow title="Язык" description="Язык интерфейса — русский." icon={Globe} disabled>
              <SettingsSelect label="Язык интерфейса" value="ru" disabled options={[["ru", "Русский"]]} />
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Дата и время" description="Формат применяется к расписанию, дедлайнам и данным файлов. Часовой пояс — Москва.">
            <SettingRow title="Формат времени" description={`Пример: ${formatTime('18:30')}`} icon={Clock3}>
              <SettingsSelect label="Формат времени" value={settings.timeFormat} options={[["24", "24 часа"], ["12", "12 часов"]]}
                onChange={value => setPreference('timeFormat', value as UserSettings['timeFormat'])} />
            </SettingRow>
            <SettingRow title="Формат даты" description={`Пример: ${formatDate('2026-11-11')}`} icon={CalendarDays}>
              <SettingsSelect label="Формат даты" value={settings.dateFormat} options={(['long', 'numeric', 'iso'] as const).map(value => [value, displayDate('2026-11-11', { ...settings, dateFormat: value })])}
                onChange={value => setPreference('dateFormat', value as UserSettings['dateFormat'])} />
            </SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'appearance' ? <>
          <SettingsGroup title="Тема">
            <SettingRow title="Режим" description="Системная тема следует настройкам устройства.">
              <RadioGroup value={theme} onValueChange={value => onThemeChange(value as Theme)} orientation="horizontal" aria-label="Тема интерфейса" className="settings-theme-options">
                {([['system', 'Системная', Monitor], ['light', 'Светлая', Sun], ['dark', 'Тёмная', Moon]] as const).map(([value, label, Icon]) =>
                  <RadioGroupItem key={value} value={value} className="settings-theme-choice" aria-label={label}><Icon aria-hidden="true" /><span>{label}</span></RadioGroupItem>)}
              </RadioGroup>
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Интерфейс">
            <SettingRow title="Плотность" description="Расстояния между строками, элементами списков и навигации.">
              <SettingsSelect label="Плотность интерфейса" value={settings.density} options={[["comfortable", "Комфортная"], ["compact", "Компактная"]]}
                onChange={value => setPreference('density', value as UserSettings['density'])} />
            </SettingRow>
            <SettingRow title="Размер текста" description="Масштаб текста в интерфейсе и разговорах.">
              <SettingsSelect label="Размер текста" value={settings.textSize} options={[["small", "Меньше"], ["default", "Стандартный"], ["large", "Крупнее"]]}
                onChange={value => setPreference('textSize', value as UserSettings['textSize'])} />
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Навигатор">
            <SettingRow title="Анимация Orb" description="Движение сферы на экране нового чата. Системное уменьшение движения имеет приоритет." icon={Sparkles}>
              {toggle('orbAnimation', 'Анимация Orb')}
            </SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'input' ? <>
          <SettingsGroup title="Набор и отправка">
            <SettingRow title="Отправка сообщения" description="Shift + Enter всегда добавляет новую строку.">
              <SettingsSelect label="Способ отправки сообщения" value={settings.sendShortcut} options={[["enter", "Enter"], ["modifier-enter", "Ctrl / ⌘ + Enter"]]}
                onChange={value => setPreference('sendShortcut', value as UserSettings['sendShortcut'])} />
            </SettingRow>
            <SettingRow title="Проверка орфографии" description="Подсветка ошибок в поле ввода средствами браузера.">
              {toggle('spellcheck', 'Проверка орфографии')}
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Горячие клавиши" description="Сочетания, которые доступны в текущем приложении.">
            <SettingRow title="Глобальный поиск"><KeyHint>Ctrl / ⌘ + K</KeyHint></SettingRow>
            <SettingRow title="Боковая навигация"><KeyHint>Ctrl / ⌘ + B</KeyHint></SettingRow>
            <SettingRow title="Отправить сообщение"><KeyHint>{settings.sendShortcut === 'enter' ? 'Enter' : 'Ctrl / ⌘ + Enter'}</KeyHint></SettingRow>
            <SettingRow title="Новая строка"><KeyHint>Shift + Enter</KeyHint></SettingRow>
            <SettingRow title="Выбрать результат поиска"><KeyHint>↑ / ↓</KeyHint></SettingRow>
            <SettingRow title="Открыть результат поиска"><KeyHint>Enter</KeyHint></SettingRow>
            <SettingRow title="Закрыть окно или меню"><KeyHint>Esc</KeyHint></SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'conversations' ? <>
          <SettingsGroup title="История">
            <SettingRow title="Отображение истории" description="Пункт «История» внутри «Навигатора». Разговоры сохраняются при любом варианте.">
              <SettingsSelect label="Отображение истории" value={settings.historyMode} options={[["collapsed", "Свёрнута"], ["expanded", "Развёрнута"], ["hidden", "Скрыта"]]}
                onChange={value => setPreference('historyMode', value as UserSettings['historyMode'])} />
            </SettingRow>
            <SettingRow title="Подтверждать удаление" description="Спрашивать перед удалением отдельного разговора. Массовая очистка всегда требует подтверждения.">
              {toggle('confirmConversationDeletion', 'Подтверждать удаление разговора')}
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Управление разговорами">
            <SettingRow title="Локальная история" description={`Разговоров на устройстве: ${conversations.length}. Загруженные файлы хранятся отдельно.`} icon={MessageSquare}>
              <Button type="button" variant="outline" className="settings-danger-action" disabled={isBusy || !conversations.length} onClick={() => setConfirmation('history')}>Очистить историю</Button>
            </SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'memory' ? <>
          <div className="settings-info-note"><Brain aria-hidden="true" /><div><p>AI-память пока недоступна</p>
            <span>Предпочтения из разговоров не сохраняются. История разговоров доступна в Навигаторе.</span></div></div>
          <SettingsGroup title="Предпочтения ассистента" description="Эти возможности появятся после подключения AI-памяти.">
            <SettingRow title="Запоминать предпочтения" description="Сохранение устойчивых предпочтений из разговоров." disabled>
              <Switch aria-label="Запоминать предпочтения" checked={false} disabled />
            </SettingRow>
            <SettingRow title="Учитывать память в ответах" description="Использование сохранённых предпочтений ассистентом." disabled>
              <Switch aria-label="Учитывать память в ответах" checked={false} disabled />
            </SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'library' ? <>
          <StudyDownloadSettings />
          <SettingsGroup title="Локальные материалы">
            <div className="settings-storage-summary"><div><span>Файлы</span><strong>{materials.length}</strong></div><div><span>Занято файлами</span><strong>{formatMaterialSize(totalSize)}</strong></div></div>
            <SettingRow title="Лимит хранилища сайта" description="Лимит задаёт браузер. Содержимое файлов хранится в IndexedDB на этом устройстве." icon={Database}>
              <span className="settings-value">{quota === null ? 'Не определён' : formatMaterialSize(quota)}</span>
            </SettingRow>
            <SettingRow title="Постоянное хранение" description={storageSupported ? 'Можно запросить у браузера защиту данных сайта от автоматического освобождения места. Решение принимает браузер.' : 'В этом браузере запрос постоянного хранения недоступен.'}>
              {persistent ? <Badge variant="success"><Check className="size-3" aria-hidden="true" />Разрешено</Badge>
                : <Button type="button" variant="outline" disabled={!storageSupported || requesting} onClick={() => void requestPersistence()}>{requesting ? 'Запрашиваем…' : 'Запросить'}</Button>}
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Управление файлами">
            <SettingRow title="Очистить библиотеку" description="Удалить файлы с устройства. Текст разговоров и сообщений сохранится." icon={Trash2}>
              <Button type="button" variant="outline" className="settings-danger-action" disabled={isBusy || !materials.length} onClick={() => setConfirmation('library')}>Очистить библиотеку</Button>
            </SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'privacy' ? <>
          <SettingsGroup title="Экспорт">
            <SettingRow title="История разговоров" description="Скачать сообщения и данные ответов в JSON. Содержимое файлов в экспорт не входит." icon={FileJson}>
              <Button type="button" variant="outline" disabled={isBusy} onClick={exportHistory}><ArrowDownToLine aria-hidden="true" />Экспортировать</Button>
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Настройки">
            <SettingRow title="Сбросить предпочтения" description="Вернуть исходную тему, вид интерфейса и настройки ввода. Разговоры и файлы сохранятся." icon={RotateCcw}>
              <Button type="button" variant="outline" disabled={isBusy} onClick={() => {
                if (resetSettings()) { onThemeChange('system'); setNotice('Настройки сброшены. Разговоры и файлы сохранены.') }
              }}>Сбросить настройки</Button>
            </SettingRow>
          </SettingsGroup>
          <SettingsGroup title="Локальные данные">
            <SettingRow title="Очистить данные приложения" description="Удалить историю, файлы и предпочтения NEW STUDENT только с этого устройства." icon={Trash2}>
              <Button type="button" variant="outline" className="settings-danger-action" disabled={isBusy} onClick={() => setConfirmation('data')}>Очистить данные</Button>
            </SettingRow>
          </SettingsGroup>
        </> : null}
        {category === 'about' ? <>
          <Card className="settings-about-card"><div><h2>{appInfo.name}</h2><p>Студенческий интерфейс Центрального университета</p></div><Badge variant="outline">{appInfo.version}</Badge></Card>
          <SettingsGroup title="О приложении">
            <SettingRow title="Навигатор" description="Расписание, домашки и учебные материалы в одном чате.">{null}</SettingRow>
            <SettingRow title="Хранение данных" description="История разговоров, файлы и настройки сохраняются на этом устройстве.">{null}</SettingRow>
          </SettingsGroup>
        </> : null}
        {(error || themeError || storageError || actionError) && !confirmation ? <p className="settings-feedback text-destructive" role="alert">{actionError || error || themeError || storageError}</p> : null}
        {notice ? <p className="settings-feedback" role="status">{notice}</p> : null}
      </div>
    </section>
    <Dialog open={confirmation !== null} onOpenChange={open => { if (!open && !working) { setConfirmation(null); setActionError(null) } }}>
      <DialogContent role="alertdialog" className="conversation-action-dialog" onOpenAutoFocus={event => { event.preventDefault(); cancelRef.current?.focus() }}>
        {confirmation ? <>
          <DialogHeader className="pr-6 text-left"><DialogTitle>{confirmations[confirmation].title}</DialogTitle>
            <DialogDescription>{confirmations[confirmation].description}</DialogDescription></DialogHeader>
          {actionError ? <p className="text-sm text-destructive" role="alert">{actionError}</p> : null}
          <DialogFooter><DialogClose asChild><Button ref={cancelRef} type="button" variant="outline" disabled={working}>Отмена</Button></DialogClose>
            <Button type="button" variant="destructive" disabled={isBusy} onClick={() => void confirm()}>{working ? 'Очищаем…' : confirmations[confirmation].action}</Button>
          </DialogFooter>
        </> : null}
      </DialogContent>
    </Dialog>
  </div></div>
}

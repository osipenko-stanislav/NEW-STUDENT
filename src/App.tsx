import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Orb, { type OrbLayer } from '@/components/Orb'
import ThemeSwitcher, { useTheme } from '@/components/ThemeSwitcher'
import WeatherWidget from '@/components/WeatherWidget'
import StudyWidget from '@/components/StudyWidget'
import PreferencesDialog from '@/components/PreferencesDialog'
import { homeworkDeadlines, upcomingClassSlots } from '@/data/study-widgets'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, useSidebar,
} from '@/components/ui/sidebar'

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/figma/${name}`
const navigatorOrbs: readonly OrbLayer[] = [
  { offset: [-0.06, 0.02], scale: 1, opacity: 0.66, phase: 0 },
  { offset: [0.07, 0.03], scale: 0.78, opacity: 0.64, phase: 2.1 },
  { offset: [0.015, -0.04], scale: 0.9, opacity: 0.74, phase: 4.2 },
]
type NavigationItem = { title: string; icon: string; children?: readonly string[] }
const navigation: readonly NavigationItem[] = [
  { title: 'Навигатор', icon: 'compass03-lined.svg' },
  { title: 'Мои цели', icon: 'target04-lined.svg' },
  { title: 'Обучение', icon: 'book-open01-lined.svg', children: [
    'Курсы', 'Ведомости', 'Зачетка', 'Домашки', 'Запись на пары', 'Посещаемость', 'Выбор курсов',
  ] },
  { title: 'Расписание', icon: 'calendar-lined.svg' },
  { title: 'Хэндбук', icon: 'file06-lined.svg' },
  { title: 'События', icon: 'announcement01-lined.svg' },
  { title: 'Сервисы', icon: 'presentation-chart02-lined.svg', children: ['Time', 'Онлайн-запись', 'It-сервисы'] },
]
const secondaryNavigation = [
  { title: 'Настройки', icon: 'settings01-lined.svg' },
]
const suggestions = ['Расписание сегодня', 'Моя неделя', 'Домашки', 'Материалы']
const nextClassTime = upcomingClassSlots[0].startsAt
const deadlineCount = homeworkDeadlines.length
const widgets = [
  { id: 'weather', title: '+7°', label: 'Погода', icon: 'cloud-snowing01-lined.svg' },
  { id: 'next-class', title: `Следующая пара: ${nextClassTime}`, label: 'Следующая пара', icon: 'video-recorder-lined.svg', section: 'Расписание' },
  { id: 'deadlines', title: `${deadlineCount} дедлайна до пятницы`, label: 'Дедлайны', icon: 'file06-lined.svg', section: 'Домашки' },
] as const
type WidgetId = (typeof widgets)[number]['id']
const widgetOptions = widgets.map(widget => ({ value: widget.id, label: widget.label }))
const suggestionOptions = suggestions.map(suggestion => ({ value: suggestion, label: suggestion }))
const panels = {
  bookmarks: { title: 'Закладки', description: 'Здесь появятся сохранённые материалы.' },
  notifications: { title: 'Уведомления', description: 'Новых уведомлений пока нет.' },
  profile: { title: 'Иван', description: 'Студент Центрального университета' },
}
type Panel = keyof typeof panels

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <img src={asset(name)} alt="" aria-hidden="true" className={`design-icon ${className}`} />
}

function GhostButton({ label, children, className = '', ...props }: ButtonProps & { label: string }) {
  return <Button type="button" variant="ghost" size="icon" aria-label={label} className={`ghost-icon ${className}`} {...props}>
    {children}
  </Button>
}

function StudentInterface() {
  const [theme, setTheme] = useTheme()
  const [section, setSection] = useState('Навигатор')
  const [panel, setPanel] = useState<Panel | null>(null)
  const [query, setQuery] = useState('')
  const [prompt, setPrompt] = useState('')
  const [promptCommand, setPromptCommand] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([])
  const [hiddenSuggestions, setHiddenSuggestions] = useState<string[]>([])
  const [openWidget, setOpenWidget] = useState<WidgetId | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toggleSidebar, setOpen, setOpenMobile, state, isMobile, openMobile } = useSidebar()
  const menuOpen = isMobile ? openMobile : state === 'expanded'

  useEffect(() => () => {
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
  }, [])

  useLayoutEffect(() => {
    const textarea = promptRef.current
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`
    }
    resize()
    let width = textarea.getBoundingClientRect().width
    const observer = new ResizeObserver(() => {
      const nextWidth = textarea.getBoundingClientRect().width
      if (nextWidth === width) return
      width = nextWidth
      resize()
    })
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [prompt, section])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') {
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function selectSection(title: string) {
    setOpenWidget(null)
    stopTyping()
    setSection(title)
    const parent = navigation.find(item => item.children?.includes(title))
    if (parent) setExpandedGroups(groups => ({ ...groups, [parent.title]: true }))
    setOpenMobile(false)
    setQuery('')
  }

  function changeWidgetOpen(id: WidgetId, open: boolean) {
    setOpenWidget(current => open ? id : current === id ? null : current)
  }

  function toggleGroup(title: string) {
    if (!isMobile && !menuOpen) {
      setOpen(true)
      setExpandedGroups(groups => ({ ...groups, [title]: true }))
      return
    }
    setExpandedGroups(groups => ({ ...groups, [title]: !groups[title] }))
  }

  function useSuggestion(value: string) {
    setPromptCommand(value)
    setSubmitError(false)
    promptRef.current?.focus()
  }

  function removePromptCommand() {
    setPromptCommand(null)
    setSubmitError(false)
    promptRef.current?.focus()
  }

  function stopTyping() {
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = null
    setIsTyping(false)
  }

  function updatePrompt(value: string) {
    setPrompt(value)
    setSubmitError(false)
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = null
    const hasText = value.trim().length > 0
    setIsTyping(hasText)
    if (hasText) {
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null
        setIsTyping(false)
      }, 1000)
    }
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    stopTyping()
    if (!promptCommand && !prompt.trim() && !attachment) {
      promptRef.current?.focus()
      return
    }
    // Keep the request intact until the assistant service is connected.
    setSubmitError(true)
  }

  return <>
    <Sidebar collapsible="icon" className="student-sidebar border-r-0 p-2">
      <SidebarHeader className="h-16 shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => selectSection('Навигатор')}
              aria-label="Центральный университет — на главную"
              className="logo-button gap-3 p-1.5 hover:bg-transparent">
              <img src={asset('cu-logo-rus-short.svg')} alt="Центральный университет" width="43" height="28"
                className="h-7 w-[43px] max-w-none shrink-0 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-8" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label="Разделы">
              <SidebarMenu>
                {navigation.map(({ title, icon, children }, index) => <SidebarMenuItem key={title}>
                  <SidebarMenuButton aria-label={title} aria-current={section === title ? 'page' : undefined}
                    isActive={section === title || (!menuOpen && !!children?.includes(section))}
                    aria-expanded={children ? menuOpen && !!expandedGroups[title] : undefined}
                    aria-controls={children ? `navigation-group-${index}` : undefined}
                    onClick={() => children ? toggleGroup(title) : selectSection(title)}>
                    <Icon name={icon} />
                    <span className="flex-1 group-data-[collapsible=icon]:hidden">{title}</span>
                    {children ? <Icon name="lucide-chevron-right.svg"
                      className={`navigation-chevron group-data-[collapsible=icon]:hidden ${expandedGroups[title] ? 'is-expanded' : ''}`} /> : null}
                  </SidebarMenuButton>
                  {children ? <SidebarMenuSub id={`navigation-group-${index}`} className="navigation-submenu"
                    hidden={!menuOpen || !expandedGroups[title]} aria-label={title}>
                    {children.map(child => <SidebarMenuSubItem key={child}>
                      <SidebarMenuSubButton asChild isActive={section === child}>
                        <button type="button" aria-current={section === child ? 'page' : undefined}
                          onClick={() => selectSection(child)}><span>{child}</span></button>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>)}
                  </SidebarMenuSub> : null}
                </SidebarMenuItem>)}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-0">
        <nav aria-label="Дополнительно">
          <SidebarMenu>
            {secondaryNavigation.map(({ title, icon }) => <SidebarMenuItem key={title}>
              <SidebarMenuButton aria-label={title} aria-current={section === title ? 'page' : undefined}
                isActive={section === title}
                onClick={() => selectSection(title)}>
                <Icon name={icon} />
                <span className="flex-1 group-data-[collapsible=icon]:hidden">{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>)}
          </SidebarMenu>
        </nav>
        <div className="app-version group-data-[collapsible=icon]:hidden">
          <span>cu-lms-app</span><Badge variant="outline" className="design-badge">2.0.1</Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="student-page h-svh min-w-0 overflow-hidden">
      <header className="student-header">
        <div className="header-breadcrumb">
          <GhostButton label={menuOpen ? 'Свернуть меню' : 'Развернуть меню'} onClick={toggleSidebar}>
            <Icon name="lucide-panel-left.svg" />
          </GhostButton>
          <div className="breadcrumb-separator"><Separator orientation="vertical" className="h-[17px]" /></div>
          <span className="truncate text-sm">{section}</span>
        </div>
        <div className="header-search">
          <div className="search-container">
            <label className="search-field">
              <Icon name="search-md-lined.svg" />
              <Input ref={searchRef} type="search" aria-label="Поиск по разделам" placeholder="Поиск"
                value={query} onChange={event => setQuery(event.target.value)}
                className="search-input border-0 p-0 shadow-none focus-visible:ring-0" />
              <kbd aria-hidden="true">⌘ + K</kbd>
            </label>
          </div>
          <div className="bookmark-action">
            <GhostButton label="Закладки" onClick={() => setPanel('bookmarks')}><Icon name="bookmark-lined.svg" /></GhostButton>
          </div>
        </div>
        <div className="header-actions">
          <ThemeSwitcher theme={theme} onChange={setTheme} />
          <GhostButton label="Late days: 24" className="late-days-action" onClick={() => selectSection('Late days')}>
            <Icon name="calendar-plus01-lined1.svg" /><span>24</span>
          </GhostButton>
          <GhostButton label="Уведомления" onClick={() => setPanel('notifications')}><Icon name="bell03-lined.svg" /></GhostButton>
          <GhostButton label="Расписание" onClick={() => selectSection('Расписание')}><Icon name="calendar-lined1.svg" /></GhostButton>
          <GhostButton label="Профиль Ивана" className="profile-action" onClick={() => setPanel('profile')}>
            <img src={asset('avatar-image.png')} alt="" className="size-7 rounded-full object-cover" />
            <img src={asset('type-status-size-default.svg')} alt="" className="profile-status" />
          </GhostButton>
        </div>
      </header>
      <div className="workspace" aria-label={section}>
        {section === 'Навигатор' ? <section className="navigator" aria-labelledby="navigator-title">
          <div className="navigator-widgets" role="group" aria-label="Виджеты">
            {widgets.filter(widget => !hiddenWidgets.includes(widget.id)).map(widget => {
              return widget.id === 'weather'
                ? <WeatherWidget key={widget.id} temperature={widget.title} open={openWidget === widget.id}
                    onOpenChange={open => changeWidgetOpen(widget.id, open)} />
                : <StudyWidget key={widget.id} kind={widget.id} label={widget.title} icon={widget.icon}
                    open={openWidget === widget.id} onOpenChange={open => changeWidgetOpen(widget.id, open)}
                    onNavigate={() => selectSection(widget.section)} />
            })}
            <PreferencesDialog triggerLabel="Настроить виджеты" triggerClassName="widget-settings"
              triggerIcon="settings04-lined.svg" title="Виджеты" description="Выберите, что показывать над анимацией."
              options={widgetOptions} hiddenValues={hiddenWidgets}
              onVisibilityChange={(id, visible) => setHiddenWidgets(hidden => visible
                ? hidden.filter(value => value !== id) : [...hidden, id])} />
          </div>
          <div className="navigator-intro">
            <div className="navigator-visual" aria-hidden="true">
              <Orb
                active={isTyping}
                layers={navigatorOrbs}
                maxFps={30}
                colors={['#9c43fe', '#4cc2e9', '#101499']}
                hoverIntensity={0.95}
                trail={0}
                rotateOnHover={false}
                followCursor={false}
                size={0.65}
                glow={3}
                wobble={3.6}
                highlight={1.1}
                tiltX={-1}
                speed={0.45}
                backgroundColor={theme === 'dark' ? '#141414' : '#ffffff'}
                clickPulse={false}
                intro={false}
                dpr={1.25}
                fallback={<img src={asset('navigator-visual.png')} alt="" className="orb-fallback" width="500" height="270" />}
              />
            </div>
            <h1 id="navigator-title">Привет, Иван! С чего начнем?</h1>
          </div>
          <div className="assistant-input">
            <form className="composer" onSubmit={submitPrompt}>
              <div className="composer-editor">
                {promptCommand ? <Badge variant="secondary" className="prompt-command">
                  <span className="prompt-command-label">/{promptCommand}</span>
                  <Button type="button" variant="ghost" size="icon" className="prompt-command-remove"
                    aria-label={`Убрать команду ${promptCommand}`} onClick={removePromptCommand}>×</Button>
                </Badge> : null}
                <Textarea ref={promptRef} name="prompt" value={prompt} aria-label="Ваш запрос" rows={3}
                  aria-describedby={promptCommand ? 'prompt-command-description' : undefined}
                  className="prompt-textarea border-0 shadow-none focus-visible:ring-0"
                  onChange={event => updatePrompt(event.target.value)}
                  onBlur={stopTyping}
                  onKeyDown={event => {
                    if (event.nativeEvent.isComposing) return
                    if (event.key === 'Backspace' && promptCommand && !event.metaKey && !event.ctrlKey && !event.altKey
                      && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
                      event.preventDefault()
                      removePromptCommand()
                    }
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }} />
              </div>
              <input type="hidden" name="command" value={promptCommand ? `/${promptCommand}` : ''} />
              {promptCommand ? <span id="prompt-command-description" className="sr-only" role="status">
                Выбрана команда /{promptCommand}. Можно дописать запрос. Backspace в начале поля уберет команду.
              </span> : null}
              {attachment ? <div className="attachment">
                <span className="truncate">{attachment.name}</span>
                <Button type="button" variant="ghost" size="icon" className="size-5 shrink-0" aria-label="Удалить вложение"
                  onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = '' }}>×</Button>
              </div> : null}
              <div className="composer-toolbar">
                <div className="flex gap-1">
                  <GhostButton label="Прикрепить файл" onClick={() => fileRef.current?.click()}><Icon name="plus-lined.svg" /></GhostButton>
                </div>
                <Button type="submit" size="icon" aria-label="Отправить запрос" className="send-button"><Icon name="arrow-up-lined.svg" /></Button>
              </div>
              <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-label="Прикрепить файл к запросу"
                onChange={event => { setAttachment(event.target.files?.[0] ?? null); setSubmitError(false) }} />
            </form>
            <div className="suggestions" aria-label="Примеры запросов">
              {suggestions.filter(suggestion => !hiddenSuggestions.includes(suggestion)).map(suggestion => <Button key={suggestion} variant="outline" onClick={() => useSuggestion(suggestion)}
                aria-pressed={promptCommand === suggestion} className="suggestion">{suggestion}</Button>)}
              <PreferencesDialog triggerLabel="Настроить подсказки" triggerClassName="suggestion-settings"
                triggerIcon="settings04-small-lined.svg" title="Примеры запросов" description="Выберите подсказки под полем ввода."
                options={suggestionOptions} hiddenValues={hiddenSuggestions}
                onVisibilityChange={(title, visible) => setHiddenSuggestions(hidden => visible
                  ? hidden.filter(value => value !== title) : [...hidden, title])} />
            </div>
            {submitError ? <p role="status" className="mt-3 text-center text-sm text-muted-foreground">
              Помощник пока недоступен. Ваш запрос остался в поле ввода.
            </p> : null}
          </div>
        </section> : null}
      </div>
    </SidebarInset>
    <Sheet open={panel !== null} onOpenChange={open => { if (!open) setPanel(null) }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{panel ? panels[panel].title : ''}</SheetTitle>
          <SheetDescription>{panel ? panels[panel].description : ''}</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  </>
}

export default function App() {
  return <SidebarProvider className="student-app" style={{ '--sidebar-width': '288px', '--sidebar-width-icon': '64px' } as CSSProperties}>
    <StudentInterface />
  </SidebarProvider>
}

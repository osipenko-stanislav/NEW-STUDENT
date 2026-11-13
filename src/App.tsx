import { useHomeworkTimers } from '@/hooks/use-homework'
import { navigate, useNavigation } from '@/hooks/use-navigation'
import { navigationForSearch } from '@/lib/search-navigation'
import type { SearchItem } from '@/types/search'
import { gradeStatements } from '@/data/grades'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, File, FolderOpen } from 'lucide-react'
import FileIcon from '@/components/FileIcon'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import MaterialsPanel from '@/components/MaterialsPanel'
import { useConversationMaterials } from '@/hooks/use-conversation-materials'
import type { MaterialLibrary } from '@/lib/material-library'
import Orb, { type OrbLayer } from '@/components/Orb'
import { SettingsProvider, useSettings, useDisplayFormats } from '@/components/SettingsProvider'
import SettingsScreen from '@/components/SettingsScreen'
import VoiceInputDemo from '@/components/VoiceInputDemo'
import { AcademicMaterialActionsProvider } from '@/components/AcademicMaterialActions'
import { DownloadDemoProvider } from '@/components/DownloadDemoProvider'
import { academicMaterials } from '@/data/academic-data'
import CoursesWorkspace from '@/components/courses/CoursesWorkspace'
import GradesWorkspace from '@/components/grades/GradesWorkspace'
import ScheduleWorkspace from '@/components/schedule/ScheduleWorkspace'
import HomeworkWorkspace from '@/components/homework/HomeworkWorkspace'
import { appInfo } from '@/data/app-info'
import ThemeSwitcher, { useTheme } from '@/components/ThemeSwitcher'
import WeatherWidget from '@/components/WeatherWidget'
import StudyWidget from '@/components/StudyWidget'
import PreferencesDialog from '@/components/PreferencesDialog'
import ConversationHistory from '@/components/ConversationHistory'
import ConversationMessages from '@/components/ConversationMessages'
import GlobalSearch from '@/components/GlobalSearch'
import { useConversations } from '@/hooks/use-conversations'
import { homeworkDeadlines, upcomingClassSlots } from '@/data/study-widgets'
import { navigation, secondaryNavigation } from '@/data/navigation'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, useSidebar,
} from '@/components/ui/sidebar'

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/figma/${name}`
const HandbookWorkspace = lazy(() => import('@/components/handbook/HandbookWorkspace'))
const navigatorOrbs: readonly OrbLayer[] = [
  { offset: [-0.06, 0.02], scale: 1, opacity: 0.66, phase: 0 },
  { offset: [0.07, 0.03], scale: 0.78, opacity: 0.64, phase: 2.1 },
  { offset: [0.015, -0.04], scale: 0.9, opacity: 0.74, phase: 4.2 },
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

function StudentInterface({ onResetSession, isResetting }: {
  onResetSession: (library: MaterialLibrary) => Promise<boolean>
  isResetting: boolean
}) {
  const [theme, setTheme, resolvedTheme, themeError] = useTheme()
  const { settings, updateSettings } = useSettings()
  const { formatTime } = useDisplayFormats()
  useHomeworkTimers()
  const { section, studyTarget } = useNavigation()
  const setSection = (section: string) => navigate({ section })
  const [panel, setPanel] = useState<Panel | null>(null)
  const [prompt, setPrompt] = useState('')
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [promptCommand, setPromptCommand] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [materialsOpen, setMaterialsOpen] = useState(false)
  const [materialPicker, setMaterialPicker] = useState(false)
  const [materialInfoId, setMaterialInfoId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(settings.historyMode === 'expanded')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const { hiddenWidgets, hiddenSuggestions } = settings
  const [openWidget, setOpenWidget] = useState<WidgetId | null>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const focusAfterVoiceRef = useRef(false)
  useEffect(() => {
    if (!voiceBusy && focusAfterVoiceRef.current) {
      focusAfterVoiceRef.current = false
      promptRef.current?.focus()
    }
  }, [voiceBusy])
  const fileRef = useRef<HTMLInputElement>(null)
  const openingMaterialPickerRef = useRef(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toggleSidebar, setOpen, setOpenMobile, state, isMobile, openMobile } = useSidebar()
  const menuOpen = isMobile ? openMobile : state === 'expanded'
  const {
    conversations, activeConversation, activeGeneration, storageError, sendMessage,
    deleteConversation, detachMaterial, renameConversation, toggleConversationPin, clearConversations,
  } = useConversations()
  const { library, scopeId, materials, selectedMaterials, error: materialsError, isBusy: materialsBusy } = useConversationMaterials(activeConversation?.id ?? null)
  const [academicPendingId, setAcademicPendingId] = useState<string | null>(null)
  const [academicError, setAcademicError] = useState<string | null>(null)
  const importingAcademic = useRef(false)
  const currentConversationId = useRef<string | null>(null)
  currentConversationId.current = activeConversation?.id ?? null
  const isConversation = section === 'Навигатор' && activeConversation !== null

  useEffect(() => { setHistoryOpen(settings.historyMode === 'expanded') }, [settings.historyMode])

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

  function openSearchResult(item: SearchItem) {
    navigate(navigationForSearch(item))
    const parent = navigation.find(group => group.children?.includes(item.section))
    if (parent) setExpandedGroups(groups => ({ ...groups, [parent.title]: true }))
    setOpenWidget(null)
    setOpenMobile(false)
    setMaterialsOpen(false)
    stopTyping()
  }

  function selectSection(destination: string) {
    const [title, target, taskTarget] = destination.split('/')
    navigate({ section: title, materialId: null, studyTarget: target, taskId: taskTarget ?? null, courseId: title === 'Курсы' ? target ?? null : null, lessonId: null, courseTab: 'course', statementId: title === 'Ведомости' ? gradeStatements.find(item => item.courseId === target && !item.archived)?.id ?? null : null, gradeTab: 'formula', ...(title === 'Навигатор' ? { conversationId: null } : {}) })
    setOpenWidget(null)
    stopTyping()
    if (title === 'Навигатор') {
      void library.startNewDraft()
      clearComposer()
    }
    const parent = navigation.find(item => item.children?.includes(title))
    if (parent) setExpandedGroups(groups => ({ ...groups, [parent.title]: true }))
    setOpenMobile(false)
  }

  async function addAcademicToChat(id: string): Promise<boolean> {
    if (importingAcademic.current || isResetting) return false
    const material = academicMaterials.find(item => item.id === id)
    if (!material) return false
    importingAcademic.current = true
    setAcademicPendingId(id)
    setAcademicError(null)
    try {
      const existing = library.getSnapshot().materials.find(item => item.sourceAcademicId === id)
      if (existing) {
        if (!library.attach(existing.id, scopeId)) throw new Error('attach')
      } else {
        const response = await fetch(`${import.meta.env.BASE_URL}${material.url}`)
        if (!response.ok) throw new Error('fetch')
        const blob = await response.blob()
        const extension = material.fileType.toLowerCase()
        const name = material.title.toLowerCase().endsWith(`.${extension}`) ? material.title : `${material.title}.${extension}`
        const mime = material.fileType === 'PDF' ? 'application/pdf' : material.fileType === 'MD' ? 'text/markdown' : 'application/x-ipynb+json'
        const added = await library.add([new window.File([blob], name, { type: mime })], scopeId, id)
        if (!added.length) throw new Error('save')
      }
      setSection('Навигатор')
      setMaterialsOpen(false)
      setOpenMobile(false)
      requestAnimationFrame(() => promptRef.current?.focus())
      return true
    } catch {
      setAcademicError('Не удалось добавить материал в чат. Повтори попытку.')
      return false
    } finally { importingAcademic.current = false; setAcademicPendingId(null) }
  }

  async function resetSession() {
    stopTyping()
    setOpenMobile(false)
    setOpenWidget(null)
    if (!await onResetSession(library)) setMaterialsOpen(true)
  }

  function askNavigator(query: string) {
    selectSection('Навигатор')
    setPrompt(query)
    requestAnimationFrame(() => promptRef.current?.focus())
  }

  function clearComposer() {
    setPrompt('')
    setPromptCommand(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function selectConversation(id: string) {
    navigate({ section: 'Навигатор', conversationId: id })
    setOpenWidget(null)
    stopTyping()
    clearComposer()
    setOpenMobile(false)
  }

  async function removeConversation(id: string) {
    if (!library.removeConversation(id)) { setMaterialsOpen(true); return }
    if (id === currentConversationId.current) {
      stopTyping()
      clearComposer()
      setSection('Навигатор')
    }
    deleteConversation(id)
  }

  function clearHistory() {
    const ids = conversations.map(conversation => conversation.id)
    if (!clearConversations()) return false
    const selectionsCleared = library.forgetConversationSelections(ids)
    stopTyping()
    clearComposer()
    return selectionsCleared
  }

  async function clearLibrary() {
    const ids = materials.map(material => material.id)
    if (!await library.clear()) return false
    ids.forEach(detachMaterial)
    return true
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
    promptRef.current?.focus()
  }

  function removePromptCommand() {
    setPromptCommand(null)
    promptRef.current?.focus()
  }

  function stopTyping() {
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = null
    setIsTyping(false)
  }

  function updatePrompt(value: string) {
    setPrompt(value)
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
    if (!promptCommand && !prompt.trim()) {
      promptRef.current?.focus()
      return
    }
    if (library.getSnapshot().pending > 0 || activeGeneration) return
    const attachments = selectedMaterials.map(material => ({ materialId: material.id, name: material.name }))
    const sent = sendMessage({ text: prompt, command: promptCommand, attachments })
    if (sent) library.completeSend(scopeId, sent.conversationId)
    clearComposer()
    promptRef.current?.focus()
  }

  return <AcademicMaterialActionsProvider addToChat={addAcademicToChat} pendingId={academicPendingId} error={academicError}>
    <Sidebar collapsible="icon" className="student-sidebar border-r-0 p-2">
      <SidebarHeader className="h-16 shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => void resetSession()}
              aria-label="Центральный университет — сбросить сессию"
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
                  <SidebarMenuButton aria-label={title}
                    aria-current={section === title && (title !== 'Навигатор' || !isConversation || !menuOpen) ? 'page' : undefined}
                    isActive={(section === title && (title !== 'Навигатор' || !isConversation || !menuOpen))
                      || (!menuOpen && !!children?.includes(section))}
                    aria-expanded={children ? menuOpen && !!expandedGroups[title] : undefined}
                    aria-controls={children ? `navigation-group-${index}` : undefined}
                    onClick={() => children ? toggleGroup(title) : selectSection(title)}>
                    <Icon name={icon} />
                    <span className="flex-1 group-data-[collapsible=icon]:hidden">{title}</span>
                    {children ? <Icon name="lucide-chevron-right.svg"
                      className={`navigation-chevron group-data-[collapsible=icon]:hidden ${expandedGroups[title] ? 'is-expanded' : ''}`} /> : null}
                  </SidebarMenuButton>
                  {title === 'Навигатор' && settings.historyMode !== 'hidden' ? <ConversationHistory visible={menuOpen} open={historyOpen}
                    onOpenChange={setHistoryOpen} conversations={conversations}
                    activeId={isConversation ? activeConversation.id : null}
                    onSelect={selectConversation} onDelete={removeConversation}
                    confirmDeletion={settings.confirmConversationDeletion} onRename={renameConversation} onTogglePin={toggleConversationPin} /> : null}
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
          <span>cu-lms-app</span><Badge variant="outline" className="design-badge">{appInfo.version}</Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="student-page h-svh min-w-0 overflow-hidden">
      <header className="student-header">
        <div className="header-breadcrumb">
          <GhostButton label={menuOpen ? 'Свернуть меню' : 'Развернуть меню'} onClick={toggleSidebar}>
            <Icon name="lucide-panel-left.svg" />
          </GhostButton>
          <span className="header-section-title">{section}</span>
        </div>
        <div className="header-search">
          <div className="search-container">
            <GlobalSearch disabled={isResetting} onNavigate={openSearchResult} onAskNavigator={askNavigator} />
          </div>
          <div className="bookmark-action">
            <GhostButton label="Закладки" onClick={() => setPanel('bookmarks')}><Icon name="bookmark-lined.svg" /></GhostButton>
          </div>
        </div>
        <div className="header-actions">
          <ThemeSwitcher theme={resolvedTheme} onChange={setTheme} />
          <GhostButton label="Late days: 24" className="late-days-action" onClick={() => selectSection('Late days')}>
            <Icon name="calendar-plus01-lined1.svg" /><span>24</span>
          </GhostButton>
          <GhostButton label="Уведомления" onClick={() => setPanel('notifications')}><Icon name="bell03-lined.svg" /></GhostButton>
          <GhostButton label="Расписание" onClick={() => selectSection('Расписание')}><Icon name="calendar-lined1.svg" /></GhostButton>
          <GhostButton label="Библиотека" id="materials-trigger" aria-controls="materials-sidebar" aria-expanded={materialsOpen}
            onClick={() => { setMaterialPicker(false); setMaterialInfoId(null); setMaterialsOpen(open => !open) }}><Icon name="archive-lined.svg" /></GhostButton>
          <GhostButton label="Профиль Ивана" className="profile-action" onClick={() => setPanel('profile')}>
            <img src={asset('avatar-image.png')} alt="" className="size-7 rounded-full object-cover" />
            <img src={asset('type-status-size-default.svg')} alt="" className="profile-status" />
          </GhostButton>
        </div>
      </header>
      <div className={`workspace-layout ${materialsOpen ? 'has-materials' : ''}`}>
      <div className={`workspace ${isConversation ? 'workspace-chat' : ''} ${section === 'Настройки' ? 'workspace-settings' : ''} ${section === 'Курсы' ? 'workspace-courses' : ''} ${section === 'Ведомости' ? 'workspace-grades' : ''} ${section === 'Хэндбук' ? 'workspace-handbook' : ''}`} aria-label={section}>
        {section === 'Хэндбук' ? <Suspense fallback={<p className="p-6 text-sm text-muted-foreground" role="status">Загружаем хэндбук…</p>}><HandbookWorkspace /></Suspense> : null}
        {section === 'Расписание' ? <ScheduleWorkspace onNavigate={selectSection} /> : null}
        {section === 'Домашки' ? <HomeworkWorkspace onNavigate={selectSection} /> : null}
        {section === 'Ведомости' ? <GradesWorkspace key={studyTarget} onOpenCourse={id => selectSection(`Курсы/${id}`)} /> : null}
        {section === 'Курсы' ? <CoursesWorkspace key={studyTarget} onOpenGrades={id => selectSection(`Ведомости/${id}`)} onAskNavigator={askNavigator} /> : null}
        {section === 'Настройки' ? <SettingsScreen theme={theme} onThemeChange={setTheme} themeError={themeError}
          conversations={conversations} materials={materials} busy={materialsBusy} storageError={storageError || materialsError}
          onClearHistory={clearHistory} onClearLibrary={clearLibrary} onClearData={() => onResetSession(library)} /> : null}
        {section === 'Навигатор' ? <section className={`navigator ${isConversation ? 'navigator-chat' : ''}`}
          aria-labelledby={isConversation ? 'conversation-title' : 'navigator-title'}>
          {activeConversation ? <ConversationMessages onNavigatorHome={() => selectSection('Навигатор')} conversation={activeConversation} materials={materials} generation={activeGeneration}
            onNavigate={selectSection} onFollowUp={value => { setPromptCommand(null); setPrompt(value); requestAnimationFrame(() => promptRef.current?.focus()) }}
            onOpenMaterial={id => { setMaterialPicker(false); setMaterialInfoId(id); setMaterialsOpen(true) }} /> : <>
          <div className="navigator-widgets" role="group" aria-label="Виджеты">
            {widgets.filter(widget => !hiddenWidgets.includes(widget.id)).map(widget => {
              return widget.id === 'weather'
                ? <WeatherWidget key={widget.id} temperature={widget.title} open={openWidget === widget.id}
                    onOpenChange={open => changeWidgetOpen(widget.id, open)} />
                : <StudyWidget key={widget.id} kind={widget.id} label={widget.id === 'next-class' ? `Следующая пара: ${formatTime(nextClassTime)}` : widget.title} icon={widget.icon}
                    open={openWidget === widget.id} onOpenChange={open => changeWidgetOpen(widget.id, open)}
                    onNavigate={() => selectSection(widget.section)} />
            })}
            <PreferencesDialog triggerLabel="Настроить виджеты" triggerClassName="widget-settings"
              triggerIcon="settings04-lined.svg" title="Виджеты" description="Выбери, что показывать над анимацией."
              options={widgetOptions} hiddenValues={hiddenWidgets}
              onVisibilityChange={(id, visible) => updateSettings({ hiddenWidgets: visible
                ? hiddenWidgets.filter(value => value !== id) : [...hiddenWidgets, id] })} />
          </div>
          <div className="navigator-intro">
            <div className="navigator-visual" aria-hidden="true">
              <Orb
                active={isTyping}
                paused={!settings.interfaceAnimations || !settings.orbAnimation}
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
                backgroundColor={resolvedTheme === 'dark' ? '#141414' : '#ffffff'}
                clickPulse={false}
                intro={false}
                dpr={1.25}
                fallback={<img src={asset('navigator-visual.png')} alt="" className="orb-fallback" width="500" height="270" />}
              />
            </div>
            <h1 id="navigator-title">Привет, Иван! С чего начнем?</h1>
          </div>
          </>}
          <div className="assistant-input">
            <form className="composer" data-voice-active={voiceBusy} onSubmit={event => { if (voiceBusy) { event.preventDefault(); return }; submitPrompt(event) }}>
              <div className="composer-editor">
                {promptCommand ? <Badge variant="ai" className="prompt-command">
                  <span className="prompt-command-label">/{promptCommand}</span>
                  <Button type="button" variant="ghost" size="icon" className="prompt-command-remove"
                    aria-label={`Убрать команду ${promptCommand}`} onClick={removePromptCommand}>×</Button>
                </Badge> : null}
                <Textarea disabled={voiceBusy} ref={promptRef} name="prompt" spellCheck={settings.spellcheck} value={prompt} aria-label="Твой запрос" placeholder={promptCommand ? undefined : 'Спроси Навигатора'} rows={2}
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
                    if (event.key === 'Enter' && !event.shiftKey && !event.altKey
                      && (settings.sendShortcut === 'enter' ? !event.ctrlKey && !event.metaKey : event.ctrlKey || event.metaKey)) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }} />
              </div>
              <input type="hidden" name="command" value={promptCommand ? `/${promptCommand}` : ''} />
              {promptCommand ? <span id="prompt-command-description" className="sr-only" role="status">
                Выбрана команда /{promptCommand}. Можно дописать запрос. Backspace в начале поля уберет команду.
              </span> : null}
              {selectedMaterials.map(material => <div key={material.id} className="attachment">
                <FileIcon name={material.name} type={material.type} size="compact" />
                <span className="truncate" title={material.name}>{material.name}</span>
                <Badge variant="warning" className="attachment-status">Не отправлено</Badge>
                <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0" disabled={materialsBusy}
                  aria-label={`Убрать вложение: ${material.name}`} onClick={() => library.detach(material.id, scopeId)}>×</Button>
              </div>)}
              {materialsBusy ? <p className="attachment-notice" role="status">Сохраняем изменения…</p> : null}
              <div className="composer-toolbar">
                <div className="flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><GhostButton label="Прикрепить файл" disabled={materialsBusy}><Icon name="plus-lined.svg" /></GhostButton></DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" collisionPadding={8} onCloseAutoFocus={event => {
                      if (!openingMaterialPickerRef.current) return
                      event.preventDefault()
                      openingMaterialPickerRef.current = false
                      requestAnimationFrame(() => document.getElementById('materials-title')?.focus())
                    }}>
                      <DropdownMenuItem onSelect={() => fileRef.current?.click()}><File aria-hidden="true" />Загрузить с устройства</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { openingMaterialPickerRef.current = true; setMaterialPicker(true); setMaterialInfoId(null); setMaterialsOpen(true) }}>
                        <FolderOpen aria-hidden="true" />Выбрать из библиотеки
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="composer-send-actions"><VoiceInputDemo key={scopeId} disabled={materialsBusy || !!activeGeneration} onBusyChange={setVoiceBusy} onTranscript={text => {
                  focusAfterVoiceRef.current = true
                  setPrompt(current => current ? `${current}${/\s$/.test(current) ? '' : ' '}${text}` : text)
                }} />
                <Button type="submit" variant="ai" size="icon" aria-label="Отправить запрос" className="send-button"
                  disabled={voiceBusy || materialsBusy || !!activeGeneration || (!promptCommand && !prompt.trim())}><ArrowUp aria-hidden="true" /></Button></div>
              </div>
              <input ref={fileRef} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Прикрепить файл к запросу"
                onChange={event => {
                  const files = Array.from(event.target.files ?? [])
                  event.target.value = ''
                  if (files.length) void library.add(files, scopeId)
                }} />
            </form>
            <div className="suggestions" aria-label="Примеры запросов">
              {suggestions.filter(suggestion => !hiddenSuggestions.includes(suggestion)).map(suggestion => <Button key={suggestion} variant="outline" disabled={voiceBusy} onClick={() => useSuggestion(suggestion)}
                aria-pressed={promptCommand === suggestion} className="suggestion">{suggestion}</Button>)}
              <PreferencesDialog triggerLabel="Настроить подсказки" triggerClassName="suggestion-settings"
                triggerIcon="settings04-small-lined.svg" title="Примеры запросов" description="Выбери подсказки под полем ввода."
                options={suggestionOptions} hiddenValues={hiddenSuggestions}
                onVisibilityChange={(title, visible) => updateSettings({ hiddenSuggestions: visible
                  ? hiddenSuggestions.filter(value => value !== title) : [...hiddenSuggestions, title] })} />
            </div>
            {materialsError && !materialsOpen ? <p role="alert" className="mt-3 text-center text-sm text-destructive">
              {materialsError}
            </p> : null}
            {storageError ? <p role="status" className="mt-3 text-center text-sm text-muted-foreground">
              {storageError}
            </p> : null}
          </div>
        </section> : null}
      </div>
    <MaterialsPanel open={materialsOpen} onOpenChange={open => { setMaterialsOpen(open); if (!open) setMaterialInfoId(null) }}
      materials={materials} library={library} error={materialsError} busy={materialsBusy}
      picker={materialPicker} selectedIds={selectedMaterials.map(material => material.id)} conversations={conversations}
      infoId={materialInfoId} onInfoChange={setMaterialInfoId}
      onAttach={id => library.attach(id, scopeId)}
      onRemove={async id => { if (await library.remove(id)) detachMaterial(id) }} />
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
  </AcademicMaterialActionsProvider>
}

export default function App() {
  const [sessionVersion, setSessionVersion] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const resetInProgress = useRef(false)

  async function resetSession(library: MaterialLibrary) {
    if (resetInProgress.current) return false
    resetInProgress.current = true
    setIsResetting(true)
    const success = await library.resetSession()
    if (success) setSessionVersion(version => version + 1)
    resetInProgress.current = false
    setIsResetting(false)
    return success
  }

  return <><SettingsProvider key={sessionVersion}><SidebarProvider inert={isResetting} aria-busy={isResetting} className="student-app" style={{ '--sidebar-width': '288px', '--sidebar-width-icon': '64px' } as CSSProperties}>
    <DownloadDemoProvider><StudentInterface onResetSession={resetSession} isResetting={isResetting} /></DownloadDemoProvider>
  </SidebarProvider></SettingsProvider>
    {isResetting ? <div role="status" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 text-sm">
      Сбрасываем сессию…
    </div> : null}
  </>
}

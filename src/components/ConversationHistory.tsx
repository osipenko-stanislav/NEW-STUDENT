import { useRef, useState, type FormEvent } from 'react'
import { ChevronRight, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar'
import type { Conversation } from '@/types/conversation'

type ConversationHistoryProps = {
  visible: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
}

export default function ConversationHistory({
  visible, open, onOpenChange, conversations, activeId, onSelect, onDelete, onRename, onTogglePin,
}: ConversationHistoryProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggers = useRef(new Map<string, HTMLButtonElement>())
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)
  const openingDialogRef = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ action: 'rename' | 'delete'; conversation: Pick<Conversation, 'id' | 'title'> } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const dialogConversation = dialog?.conversation

  function showDialog(action: 'rename' | 'delete', conversation: Conversation) {
    openingDialogRef.current = true
    returnFocusRef.current = menuTriggers.current.get(conversation.id) ?? null
    setName(conversation.title)
    setDialog({ action, conversation: { id: conversation.id, title: conversation.title } })
    setDialogOpen(true)
  }

  function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dialogConversation || !name.trim()) return
    onRename(dialogConversation.id, name)
    setDialogOpen(false)
  }

  return <><SidebarMenuSub className="navigation-submenu" hidden={!visible} aria-label="Навигатор">
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="conversation-history"
          onClick={() => onOpenChange(!open)}>
          <span className="flex-1">История</span>
          <ChevronRight aria-hidden="true" className={`navigation-chevron ${open ? 'is-expanded' : ''}`} />
        </button>
      </SidebarMenuSubButton>
      <ul id="conversation-history" className="conversation-history" hidden={!open} aria-label="Сохраненные диалоги">
        {conversations.length === 0 ? <li className="conversation-history-empty">Пока нет диалогов</li> : null}
        {conversations.map(conversation => <SidebarMenuSubItem key={conversation.id} className="conversation-history-row">
          <SidebarMenuSubButton asChild isActive={activeId === conversation.id} className="conversation-history-link">
            <button type="button" title={conversation.title} aria-label={`Открыть диалог: ${conversation.title}`}
              aria-description={conversation.pinned ? 'Закреплен' : undefined}
              aria-current={activeId === conversation.id ? 'page' : undefined} onClick={() => onSelect(conversation.id)}>
              {conversation.pinned ? <Pin aria-hidden="true" className="conversation-pin" /> : null}
              <span>{conversation.title}</span>
            </button>
          </SidebarMenuSubButton>
          <DropdownMenu open={menuId === conversation.id} onOpenChange={nextOpen => setMenuId(nextOpen ? conversation.id : null)}>
            <DropdownMenuTrigger asChild>
              <Button ref={element => {
                if (element) menuTriggers.current.set(conversation.id, element)
                else menuTriggers.current.delete(conversation.id)
              }} type="button" variant="ghost" size="icon" className="conversation-menu-trigger"
                aria-label={`Действия с разговором: ${conversation.title}`} title="Действия с разговором">
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" collisionPadding={8} className="w-48"
              onCloseAutoFocus={event => { if (openingDialogRef.current) event.preventDefault() }}>
              <DropdownMenuItem onSelect={() => showDialog('rename', conversation)}>
                <Pencil aria-hidden="true" />Переименовать
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onTogglePin(conversation.id)}>
                {conversation.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                {conversation.pinned ? 'Открепить' : 'Закрепить'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => showDialog('delete', conversation)}>
                <Trash2 aria-hidden="true" />Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuSubItem>)}
      </ul>
    </SidebarMenuSubItem>
  </SidebarMenuSub>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="conversation-action-dialog"
        onOpenAutoFocus={event => {
          event.preventDefault()
          if (dialog?.action === 'rename') { nameRef.current?.focus(); nameRef.current?.select() }
          else cancelRef.current?.focus()
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          openingDialogRef.current = false
          const target = returnFocusRef.current
          if (target?.isConnected) target.focus()
          else triggerRef.current?.focus()
        }}>
        {dialog?.action === 'rename' ? <form onSubmit={rename} className="grid gap-4">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle>Переименовать разговор</DialogTitle>
            <DialogDescription>Введите название разговора.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor="conversation-name" className="text-sm font-medium">Название</label>
            <Input ref={nameRef} id="conversation-name" aria-label="Название разговора" autoComplete="off"
              value={name} onChange={event => setName(event.target.value)} />
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild><Button type="button" variant="outline">Отмена</Button></DialogClose>
            <Button type="submit" disabled={!name.trim()}>Сохранить</Button>
          </DialogFooter>
        </form> : <>
          <DialogHeader className="pr-6 text-left">
            <DialogTitle>Удалить разговор?</DialogTitle>
            <DialogDescription className="[overflow-wrap:anywhere]">
              Разговор «{dialogConversation?.title}» и его сообщения будут удалены. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild><Button ref={cancelRef} type="button" variant="outline">Отмена</Button></DialogClose>
            <Button type="button" variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => {
              if (dialogConversation) onDelete(dialogConversation.id)
              setDialogOpen(false)
            }}>Удалить</Button>
          </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  </>
}

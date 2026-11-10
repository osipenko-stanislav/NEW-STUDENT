import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

type PreferenceOption = { value: string; label: string }

type PreferencesDialogProps = {
  triggerLabel: string
  triggerClassName: string
  triggerIcon: string
  title: string
  description: string
  options: readonly PreferenceOption[]
  hiddenValues: readonly string[]
  onVisibilityChange: (value: string, visible: boolean) => void
}

export default function PreferencesDialog({
  triggerLabel, triggerClassName, triggerIcon, title, description,
  options, hiddenValues, onVisibilityChange,
}: PreferencesDialogProps) {
  return <Dialog>
    <DialogTrigger asChild>
      <Button type="button" variant="ghost" size="icon" aria-label={triggerLabel}
        className={`ghost-icon ${triggerClassName}`}>
        <img src={`/assets/figma/${triggerIcon}`} alt="" aria-hidden="true" className="design-icon" />
      </Button>
    </DialogTrigger>
    <DialogContent className="navigator-settings-dialog">
      <DialogHeader className="pr-6 text-left">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="navigator-preferences">
        {options.map(option => <label key={option.value}>
          <span>{option.label}</span>
          <input type="checkbox" checked={!hiddenValues.includes(option.value)}
            onChange={event => onVisibilityChange(option.value, event.target.checked)} />
        </label>)}
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button">Готово</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

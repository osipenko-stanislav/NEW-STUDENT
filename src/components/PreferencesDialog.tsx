import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
        <img src={`${import.meta.env.BASE_URL}assets/figma/${triggerIcon}`} alt="" aria-hidden="true" className="design-icon" />
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
          <Switch checked={!hiddenValues.includes(option.value)}
            onCheckedChange={checked => onVisibilityChange(option.value, checked)} />
        </label>)}
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button">Готово</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

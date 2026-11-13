import WidgetPopover from '@/components/WidgetPopover'

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/figma/${name}`
const forecast = [
  { temperature: 6, icon: 'weather-cloud-snow.svg', condition: 'Снег' },
  { temperature: 2, icon: 'weather-cloud-sun.svg', condition: 'Переменная облачность' },
  { temperature: 4, icon: 'weather-cloud-snow.svg', condition: 'Снег' },
  { temperature: 6, icon: 'weather-cloud-rain.svg', condition: 'Дождь' },
  { temperature: 5, icon: 'weather-cloud-snow.svg', condition: 'Снег' },
  { temperature: 5, icon: 'weather-cloud-snow.svg', condition: 'Снег' },
]

export default function WeatherWidget({ temperature, open, onOpenChange }: {
  temperature: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return <WidgetPopover open={open} onOpenChange={onOpenChange} title="Погода в Москве"
    triggerLabel={temperature} triggerAriaLabel={`Погода: ${temperature}`}
    triggerIcon="cloud-snowing01-lined.svg" contentClassName="weather-popover">
      <div className="weather-current">
        <img src={asset('weather-cloud-snow.svg')} alt="" aria-hidden="true" className="design-icon" />
        <span className="weather-temperature">6° C</span>
        <span className="weather-condition">Облачно</span>
      </div>
      <div className="weather-location">
        <span>Россия, Москва</span>
        <span>Макс: 6°&nbsp; Мин: 2°</span>
      </div>
      <ul className="weather-forecast" aria-label="Прогноз погоды">
        {forecast.map((item, index) => <li key={index} aria-label={`${item.condition}, ${item.temperature}° C`}>
          <img src={asset(item.icon)} alt="" aria-hidden="true" className="design-icon" />
          <span>{item.temperature}° C</span>
        </li>)}
      </ul>
      <div className="weather-banner">
        <img src={asset('weather-banner-glow.svg')} alt="" aria-hidden="true" className="weather-banner-glow" />
        <div className="weather-advice">
          <h3>Как одеться?</h3>
          <p data-typography="accent-title" className="weather-advice-title">Сегодня потеплее</p>
          <p className="weather-advice-description">На улице прохладно, в Москве началась настоящая осень</p>
        </div>
        <img src={asset('weather-coat.png')} alt="" aria-hidden="true" className="weather-coat" width="96" height="96" />
      </div>
  </WidgetPopover>
}

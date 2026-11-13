export default function CourseDiagram() {
  return <svg viewBox="0 0 640 220" role="img" aria-labelledby="course-diagram-title" className="course-learning-diagram">
    <title id="course-diagram-title">Рабочий процесс: данные, модель, оценка качества</title>
    <g className="course-diagram-blue"><rect x="24" y="32" width="168" height="144" rx="18" /><path d="M58 72h100M58 92h100M58 112h100M82 60v64M112 60v64M142 60v64" /><text x="108" y="153" textAnchor="middle">Данные</text></g>
    <g className="course-diagram-violet"><rect x="236" y="32" width="168" height="144" rx="18" /><path d="m274 104 34-32 22 40 34-34M274 72l34 32 22-32 34 32" /><circle cx="274" cy="72" r="5" /><circle cx="274" cy="104" r="5" /><circle cx="308" cy="72" r="5" /><circle cx="308" cy="104" r="5" /><circle cx="330" cy="72" r="5" /><circle cx="330" cy="112" r="5" /><circle cx="364" cy="78" r="5" /><circle cx="364" cy="104" r="5" /><text x="320" y="153" textAnchor="middle">Модель</text></g>
    <g className="course-diagram-green"><rect x="448" y="32" width="168" height="144" rx="18" /><path d="M484 62v54h98M494 102l21-23 21 9 35-32" /><text x="532" y="153" textAnchor="middle">Оценка качества</text></g>
    <path className="course-diagram-arrows" d="M202 104h24m-7-6 7 6-7 6M414 104h24m-7-6 7 6-7 6" />
  </svg>
}

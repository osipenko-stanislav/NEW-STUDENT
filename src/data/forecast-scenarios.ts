import { academicTasks, gradeStatements, courseTopics } from './academic-data.ts'
import type { ForecastTask } from '../lib/grade-forecast.ts'

// Additional future work belongs only to the local forecasting fixture.
// Shared coursework and recorded marks are never mutated.
export const forecastScenarios = gradeStatements.filter(statement => !statement.archived && statement.semester !== null).map(statement => {
  const tasks: ForecastTask[] = academicTasks.filter(task => task.enrollmentId === statement.id).map(task => ({ ...task }))
  const homework = statement.formula?.find(row => row.id === 'homework') ?? statement.formula?.[0]
  const topics = statement.courseId ? courseTopics(statement.courseId) : []
  if (homework) {
    for (let index = 0; index < 3; index++) tasks.push({
      id: `forecast-${statement.id}-homework-${index + 1}`, activityId: homework.id,
      title: `Домашнее задание ${index + 2}: ${topics[index % topics.length] ?? homework.title}`,
      grade: null, status: 'new',
    })
  }
  const formula = statement.formula?.map(row => {
    const group = tasks.filter(task => task.activityId === row.id)
    // This fixture completes missing work lists using the existing activity names.
    // It preserves the activity's source weight and all already recorded grades.
    const total = Math.max(row.total ?? group.length, group.length)
    for (let index = group.length; index < total; index++) tasks.push({
      id: `forecast-${statement.id}-${row.id}-${index + 1}`, activityId: row.id,
      title: `${row.title} ${index + 1}`, grade: null, status: 'new',
    })
    return { ...row, total }
  }) ?? []
  return { ...statement, tasks, formula }
})

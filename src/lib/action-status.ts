/** Ephemeral outcomes of explicit student operations. Restored data never emits tasks. */
export type ActionStatus = 'running' | 'success' | 'error'
export type StatusTask = { id: string; key?: string; label: string; detail?: string; status: ActionStatus; progress?: number; updatedAt: number; revision: number }
type TaskInput = Pick<StatusTask, 'label'> & Partial<Pick<StatusTask, 'key' | 'detail' | 'progress'>>
export function createActionStatusStore(now: () => number = Date.now) {
  let tasks: readonly StatusTask[] = []
  let sequence = 0
  const listeners = new Set<() => void>()
  const publish = (next: readonly StatusTask[]) => { tasks = next.filter((item, index, all) => item.status !== 'success' || all.slice(index).filter(value => value.status === 'success').length <= 6); for (const listener of listeners) listener() }
  function put(input: TaskInput, status: ActionStatus) {
    const previous = input.key ? tasks.find(task => task.key === input.key) : undefined
    const task: StatusTask = { ...input, id: previous?.id ?? `action-${++sequence}`, status, updatedAt: now(), revision: (previous?.revision ?? 0) + 1 }
    publish([...tasks.filter(item => item.id !== task.id), task])
    return task.id
  }
  function update(id: string, patch: Partial<Pick<StatusTask, 'label' | 'detail' | 'status' | 'progress'>>) {
    if (!tasks.some(task => task.id === id)) return
    const previous = tasks.find(task => task.id === id)!
    const next = { ...previous, ...patch, updatedAt: now(), revision: previous.revision + 1 }
    publish(patch.status && patch.status !== previous.status ? [...tasks.filter(task => task.id !== id), next] : tasks.map(task => task.id === id ? next : task))
  }
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => tasks,
    begin: (input: TaskInput) => put(input, 'running'),
    report: (input: TaskInput, ok = true) => put(input, ok ? 'success' : 'error'),
    update,
    finish: (id: string, label: string, ok = true, detail?: string) => update(id, { label, status: ok ? 'success' : 'error', detail, progress: undefined }),
    dismiss: (id: string, revision?: number) => publish(tasks.filter(task => task.id !== id || task.status === 'running' || revision !== undefined && task.revision !== revision)),
    clear: () => publish([]),
  }
}
export const actionStatus = createActionStatusStore()

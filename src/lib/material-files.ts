type StoredFile = { id: string; blob: Blob }

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('File storage unavailable')); return }
    let failed = false
    const request = indexedDB.open('student-material-files', 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('files')) request.result.createObjectStore('files', { keyPath: 'id' })
    }
    request.onsuccess = () => {
      if (failed) request.result.close()
      else {
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
    }
    request.onerror = () => { failed = true; reject(request.error) }
    request.onblocked = () => { failed = true; reject(new Error('File storage blocked')) }
  })
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    let value: T
    let tx: IDBTransaction
    try { tx = database.transaction('files', mode) }
    catch (error) { database.close(); reject(error); return }
    tx.oncomplete = () => { database.close(); resolve(value) }
    tx.onerror = tx.onabort = () => { database.close(); reject(tx.error ?? new Error('File transaction failed')) }
    try { run(tx.objectStore('files'), result => { value = result }) }
    catch (error) { tx.abort(); database.close(); reject(error) }
  })
}

export function putMaterialFiles(files: StoredFile[]): Promise<void> {
  return transaction<void>('readwrite', store => { for (const file of files) store.put(file) })
}

export function deleteMaterialFiles(ids: string[]): Promise<void> {
  if (!ids.length) return Promise.resolve()
  return transaction<void>('readwrite', store => { for (const id of ids) store.delete(id) })
}

export function getMaterialFile(id: string): Promise<Blob | null> {
  return transaction<Blob | null>('readonly', (store, result) => {
    const request = store.get(id)
    request.onsuccess = () => result((request.result as StoredFile | undefined)?.blob ?? null)
  })
}

export function clearMaterialFiles(): Promise<void> {
  return transaction<void>('readwrite', store => { store.clear() })
}

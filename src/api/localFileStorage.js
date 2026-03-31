const DB_NAME = 'vf_files';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function uploadFile({ file }) {
  const db = await openDB();
  const id = crypto.randomUUID();
  const key = `vf-file://${id}/${file.name}`;

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  return { file_url: key };
}

export async function getFileUrl(key) {
  if (!key || !key.startsWith('vf-file://')) return key;

  const db = await openDB();
  const blob = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (!blob) return key;
  return URL.createObjectURL(blob);
}

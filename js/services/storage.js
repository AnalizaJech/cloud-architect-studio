const KEY = "cloud-architect-studio-document";
/** Open a small IndexedDB store. Rejection activates localStorage fallback. */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) return reject(Error("No IndexedDB"));
    const request = indexedDB.open("cloud-architect-studio", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("documents");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
/** Load the last document from browser storage. */
export async function loadDocument() {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("documents")
        .objectStore("documents")
        .get(KEY);
      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  }
}
/** Save a document asynchronously with a localStorage fallback. */
export async function saveDocument(document) {
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("documents", "readwrite");
      tx.objectStore("documents").put(document, KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.setItem(KEY, JSON.stringify(document));
  }
}

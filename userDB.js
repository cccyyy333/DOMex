// IndexedDB 열기 (스토어 2개: elementStore, domStore)
function openUserDB(db_name, db_version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(db_name, db_version);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("userElementStore")) {
        db.createObjectStore("userElementStore", { keyPath: "timestamp" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 데이터 저장 (store_name: "elementStore" 또는 "domStore")
async function saveUserData(dataset, db_name, db_version, store_name) {
  const db = await openUserDB(db_name, db_version);
  const tx = db.transaction(store_name, "readwrite");
  const store = tx.objectStore(store_name);

  store.add({ ...dataset });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(dataset);
    tx.onerror = () => reject(tx.error);
  });
}

// 데이터 조회
async function getAllUserData(db_name, db_version, store_name) {
  const db = await openUserDB(db_name, db_version);
  const tx = db.transaction(store_name, "readonly");
  const store = tx.objectStore(store_name);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 전체 데이터 삭제
async function clearUserData(db_name, db_version, store_name) {
  const db = await openUserDB(db_name, db_version);
  const tx = db.transaction(store_name, "readwrite");
  const store = tx.objectStore(store_name);
  store.clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      console.log(`[ContentDB] ${store_name} 데이터 삭제 완료`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function exportUserDataToFile(db_name, db_version, store_name) {
  try {
    const data = await getAllUserData(db_name, db_version, store_name);

    await clearUserData(db_name, db_version, store_name);

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${store_name}_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`[userDB] ${store_name} 데이터 export 성공`);
  } catch (error) {
    console.error(`[userDB] export 실패:`, error);
  }
}

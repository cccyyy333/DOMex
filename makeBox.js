
function serializeEyeBoxes() {
  return eyeBoxes.map((box, idx) => {
    const r = box.getBoundingClientRect();
    return {
      id: box.dataset.eyeBoxId,
      rect: {
        x: r.left,
        y: r.top,
        width: r.width,
        height: r.height,
      },
      grid: {
        rows: Number(box.dataset.rows),
        cols: Number(box.dataset.cols),
      },
      priority: idx,
      createdAt: box.dataset.createdAt
        ? Number(box.dataset.createdAt)
        : Date.now(),
    };
  });
}


// case "saveData":
//   const eyeBoxData = serializeEyeBoxes();

//   exportUserDataToFile(
//     U_DB_NAME,
//     U_DB_VERSION,
//     U_STORE_NAME,
//     { eyeBoxes: eyeBoxData }
//   );

//   sendResponse({ status: "ok" });
//   return true;


function restoreEyeBoxes(saved) {
  saved
    .sort((a, b) => a.priority - b.priority)
    .forEach(data => {
      const box = createEyeBox(
        data.rect.x,
        data.rect.y,
        data.rect.width,
        data.rect.height,
        data.grid.rows,
        data.grid.cols
      );
      box.dataset.eyeBoxId = data.id;
      box.dataset.createdAt = data.createdAt;
      eyeBoxes.push(box);
    });
}

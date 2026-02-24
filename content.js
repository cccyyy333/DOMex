let lastTarget = null;
let hoverStartTime = null;
const OVERLAY_DURATION = 100; // 0.1초
const U_HIGHLIGHT_CLASS = "user-highlight-box";
const USER_CURSOR_ID = "user-cursor";

const U_DB_NAME = "userDB";
const U_STORE_NAME = "userElementStore";
const U_DB_VERSION = 1;
let idCounter = 0;
let cursorVisible = true;

let manageMode = false;
let visualizeMode = false;

let eyeBoxes = [];
let currentBox = null;
let dragStartX = 0;
let dragStartY = 0;
let selectedBox = null;


let manualSegmentationMode = false;
let manualSeeds = [];
let manualOverlayLayer = null;

let hoverPreviewBox = null;
let currentHoverTarget = null;





function createGazeCursor() {
    let cursor = document.getElementById(USER_CURSOR_ID);
    if (!cursor) {
        cursor = document.createElement("div");
        cursor.id = USER_CURSOR_ID;
        Object.assign(cursor.style, {
            position: "fixed",
            width: "10px",
            height: "10px",
            backgroundColor: "blue",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 9999,
            transform: "translate(-50%, -50%)",
        });
        document.body.appendChild(cursor);
    }
    return cursor;
}

// 특정 요소 강조 (빨간 박스)
function highlightElement(target) {
    removeHighlight();

    const rect = target.getBoundingClientRect();
    const highlight = document.createElement("div");
    highlight.className = U_HIGHLIGHT_CLASS;

    Object.assign(highlight.style, {
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: "rgba(0, 0, 255, 0.3)",
        pointerEvents: "none",
        zIndex: 9998
    });

    document.body.appendChild(highlight);
}

// 기존 강조 제거
function removeHighlight() {
    document.querySelectorAll(`.${U_HIGHLIGHT_CLASS}`).forEach(el => el.remove());
}

// 마우스 이동 감지하여 처리
document.addEventListener("mousemove", (event) => {
    if (!visualizeMode) return;
    const gazeCursor = createGazeCursor();

    // 빨간 점 이동
    Object.assign(gazeCursor.style, {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
    });

    const element = document.elementFromPoint(event.clientX, event.clientY);

    if (!element || element === document.body || element === document.documentElement) {
        lastTarget = null;
        hoverStartTime = null;
        removeHighlight();
        return;
    }

    if (element !== lastTarget) {
        lastTarget = element;
        hoverStartTime = performance.now();
        removeHighlight();
        return;
    }

    const now = performance.now();
    if (hoverStartTime && (now - hoverStartTime >= OVERLAY_DURATION)) {
        highlightElement(element);
    }
});






chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case "saveData":
      exportUserDataToFile(U_DB_NAME, U_DB_VERSION, U_STORE_NAME);
      sendResponse({ status: "ok" });
      return true;

    case "visualizeCursor":
        console.log("시선 커서 시각화 상태 변경:", message.state);
      visualizeMode = message.state;
      if (!visualizeMode) {
        document.getElementById(USER_CURSOR_ID)?.remove();
        removeHighlight();
      }
      break;

    case "manage":
        console.log("관리 모드 상태 변경:", message.state);
      manageMode = message.state;
      toggleEyeBoxes(manageMode);
      break;


  case "startManualSegmentation":
    console.log("segStart");
    startManualSegmentation();
    break;

  case "finishManualSegmentation":
    console.log("seg finish");
    finishManualSegmentation();
    break;

  case "cancelManualSegmentation":
    console.log("seg cancel");
    cancelManualSegmentation();
    break;


      case "updateGrid":
  if (!selectedBox) return;

  updateGridOnBox(
    selectedBox,
    message.rows,
    message.cols
  );
  break;

  }
});

function toggleEyeBoxes(show) {
  eyeBoxes.forEach(box => {
    box.style.display = show ? "block" : "none";
    box.style.pointerEvents = show ? "auto" : "none";
  });
}


document.addEventListener("mousedown", e => {
  if (!manageMode || e.button !== 0) return;

  if (isPointInsideAnyEyeBox(e.clientX, e.clientY)) {
    console.log("이미 존재하는 감지 영역 내부에서 드래그 시작됨");
    return;
  }

  dragStartX = e.clientX;
  dragStartY = e.clientY;

  currentBox = createEyeBox(dragStartX, dragStartY, 0, 0);
});

document.addEventListener("mousemove", e => {
  if (!currentBox) return;

  const x = Math.min(dragStartX, e.clientX);
  const y = Math.min(dragStartY, e.clientY);
  const w = Math.abs(e.clientX - dragStartX);
  const h = Math.abs(e.clientY - dragStartY);

  Object.assign(currentBox.style, {
    left: `${x}px`,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`,
  });
});

document.addEventListener("mouseup", () => {
  if (!currentBox) return;

  const id = prompt("감지 영역 ID (필수)");
  if (!id) {
    currentBox.remove();
    currentBox = null;
    return;
  }

  currentBox.dataset.eyeBoxId = id;
  createGridCells(currentBox, 3, 3);// rows, cols 기본값 3
  eyeBoxes.unshift(currentBox);
  currentBox = null;
});

document.addEventListener("contextmenu", (e) => {
  const target = e.target;
    const rect = target.getBoundingClientRect();
    const url = window.location.href;

if (manageMode) {
  e.preventDefault();

  const rect = e.target.getBoundingClientRect();
  const box = createEyeBox(rect.left, rect.top, rect.width, rect.height);

  const id = prompt("감지 영역 ID (필수)");
  if (!id) {
    box.remove();
    return;
  }

  box.dataset.eyeBoxId = id;
  box.dataset.autoGenerated = "false";
  eyeBoxes.unshift(box);
  return;
}
if(!visualizeMode) return;
  // 기본 우클릭 메뉴 방지
  e.preventDefault();

  if (!target) {
      console.warn("우클릭한 대상이 없음");
      return;
  }

  console.log(" 우클릭한 DOM 요소 정보 --------");
  console.log(" tagName:", target.tagName);
  console.log(" id:", target.id);
  console.log(" class:", target.className);
  console.log(" innerText:", target.innerText);
  console.log(" innerHTML:", target.innerHTML);
  console.log(" outerHTML:", target.outerHTML);
  console.log(" 전체 dataset:", target.dataset);
  console.log(" 부모 요소:", target.parentElement);
  console.log(" 자식 요소 수:", target.children.length);
  console.log(" 전체 속성 목록:");
  Array.from(target.attributes).forEach(attr => {
      console.log(`   - ${attr.name}: ${attr.value}`);
  });
  console.log(" ------------------------------");


  const attributes = {};
  if (target.alt) attributes.alt = target.alt;
  if (target.title) attributes.title = target.title;
  if (target.placeholder) attributes.placeholder = target.placeholder;
  if (target.href) attributes.href = target.href;
  if (target.src) attributes.src = target.src;
  if (target.type) attributes.type = target.type;


const textContent = target.innerText?.trim() || target.textContent?.trim() || "";

const data = {
    timestamp: idCounter++, 
    url,
    elementMeta: {
      id: target.id || null,
      className: target.className || null,
      tagName: target.tagName,
      text: textContent.slice(0, 200),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      attributes,
    }
  };

  saveUserData(data, U_DB_NAME, U_DB_VERSION, U_STORE_NAME)
    .then(() => console.log("User data saved successfully"))
    .catch((error) => console.error("Error saving User data:", error));

});

function createEyeBox(x, y, w, h, rows = 0, cols = 0, eyeBoxId) {
  const box = document.createElement("div");

  box.dataset.eyeBoxId = eyeBoxId || `auto-${Date.now()}`;
  box.dataset.rows = rows;
  box.dataset.cols = cols;

  Object.assign(box.style, {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`,
    border: "2px solid #00ffcc",
    background: "rgba(0,255,204,0.08)",
    zIndex: 2147483647,
  });

  document.body.appendChild(box);

  // ✅ grid는 rows, cols가 1 이상일 때만 생성
  if (rows > 0 && cols > 0) {
    createGridCells(box, rows, cols);
  }

  return box;
}





function createGridCells(box, rows, cols) {
  const cells = [];
  const boxRect = box.getBoundingClientRect();

  const cellWidth = boxRect.width / cols;
  const cellHeight = boxRect.height / rows;

  const boxId = box.dataset.eyeBoxId;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");

      cell.dataset.cellId = `${boxId}:r${r}:c${c}`;
      cell.dataset.row = r;
      cell.dataset.col = c;

      Object.assign(cell.style, {
        position: "absolute",
        left: `${c * cellWidth}px`,
        top: `${r * cellHeight}px`,
        width: `${cellWidth}px`,
        height: `${cellHeight}px`,
        border: "1px dashed rgba(255,255,255,0.4)",
        boxSizing: "border-box",
        pointerEvents: "auto",
      });

      // 디버깅용 (선택)
      // cell.innerText = `${r},${c}`;
      // cell.style.color = "white";

      box.appendChild(cell);
      cells.push(cell);
    }
  }

  return cells;
}



function selectEyeBox(box) {
  if (selectedBox) {
    selectedBox.style.outline = "";
  }

  selectedBox = box;
  box.style.outline = "2px solid red";

  const action = prompt(
    `선택된 감지 영역: ${box.dataset.eyeBoxId}\n\n1: ID 수정\n2: 삭제\n(취소: 아무 입력 안 함)`
  );

  if (action === "1") {
    const newId = prompt("새 ID 입력");
    if (newId) box.dataset.eyeBoxId = newId;
  }

  if (action === "2") {
    eyeBoxes = eyeBoxes.filter(b => b !== box);
    box.remove();
    selectedBox = null;
  }
}


function updateGridOnBox(box, rows, cols) {
  box.dataset.rows = rows;
  box.dataset.cols = cols;

  // 기존 cell 제거
  box.querySelectorAll("[data-cell-id]").forEach(c => c.remove());

  createGridCells(box, rows, cols);
}



function isPointInsideAnyEyeBox(x, y) {
  return eyeBoxes.some(box => {
    const rect = box.getBoundingClientRect();
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  });
}

//segmentation

function startManualSegmentation() {
  manualSegmentationMode = true;
  manualSeeds = [];
  createManualOverlayLayer();


  document.addEventListener("mousemove", handleManualHover, true);
  document.addEventListener("click", handleManualClick, true);
}

function createManualOverlayLayer() {
  if (manualOverlayLayer) return;

  manualOverlayLayer = document.createElement("div");

  Object.assign(manualOverlayLayer.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: 2147483645
  });

  document.body.appendChild(manualOverlayLayer);
}


function generateSelector(el) {
  if (!el) return null;

  if (el.id) return `#${CSS.escape(el.id)}`;

  let path = [];

  while (el && el.nodeType === 1 && el !== document.body) {

    let tag = el.tagName.toLowerCase();

    // SVG tagName 정상 처리
    if (el instanceof SVGElement) {
      tag = el.tagName.toLowerCase();
    }

    let selector = tag;

    if (el.classList && el.classList.length > 0) {
      const classes = Array.from(el.classList)
        .slice(0, 2)
        .map(c => CSS.escape(c))
        .join(".");
      selector += "." + classes;
    }

    path.unshift(selector);
    el = el.parentElement;
  }

  return path.join(" > ");
}

function handleManualClick(e) {
  if (!manualSegmentationMode) return;

  e.preventDefault();
  e.stopPropagation();

  let target = e.target;

  if (!target || target === document.body || target === document.documentElement) return;

  // SVG 내부 element 처리
  if (target instanceof SVGElement) {
    target = target.closest("svg") || target;
  }

  const rect = target.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;

  const seed = {
    selector: generateSelector(target),
    rect: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    }
  };

  manualSeeds.push(seed);
  renderConfirmedSeed(seed);
}


function finishManualSegmentation() {
  manualSegmentationMode = false;
  document.removeEventListener("mousemove", handleManualHover, true);
  document.removeEventListener("click", handleManualClick, true);

  removeHoverPreview();
  runManualSegmentation();

  manualOverlayLayer?.remove();
  manualOverlayLayer = null;

  //debugRenderSegmentation();

}

function runManualSegmentation() {

  rebuildBox(); // 기존 auto box 제거

  const expandedRegions = manualSeeds.map(seed => {
    const el = document.querySelector(seed.selector);
    if (!el) return null;

    const logical = expandToLogicalBlock(el);
    return logical;
  }).filter(Boolean);

  segmentationRegions = expandedRegions;

  convertSegmentationToEyeBoxes();
}

function expandToLogicalBlock(el) {

  let current = el;

  // while (current.parentElement) {

  //   const parent = current.parentElement;
  //   const rect = parent.getBoundingClientRect();

  //   // 너무 커지면 중단
  //   if (
  //     rect.width > window.innerWidth * 0.95 ||
  //     rect.height > window.innerHeight * 0.95
  //   ) break;

  //   current = parent;
  // }

  // 부모 요소 대신 패딩 추가한다던가 하는 로직 추가할것

  const rect = current.getBoundingClientRect();

  return {
    selector: generateSelector(current),
    rect: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    }
  };
}

function cancelManualSegmentation() {
  manualSegmentationMode = false;

  document.removeEventListener("mousemove", handleManualHover, true);
  document.removeEventListener("click", handleManualClick, true);

  removeHoverPreview();

  manualOverlayLayer?.remove();
  manualOverlayLayer = null;

  manualSeeds = [];
}
function handleManualHover(e) {
  if (!manualSegmentationMode) return;

  let target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target) return;

  if (target === document.body || target === document.documentElement) {
    removeHoverPreview();
    return;
  }

  // SVG 내부 요소면 상위 svg 단위로 승격
  if (target instanceof SVGElement) {
    target = target.closest("svg") || target;
  }

  if (target === currentHoverTarget) return;

  currentHoverTarget = target;

  const rect = target.getBoundingClientRect();

  if (rect.width < 20 || rect.height < 20) {
    removeHoverPreview();
    return;
  }

  renderHoverPreview(rect);
}

function renderHoverPreview(rect) {
  removeHoverPreview();

  hoverPreviewBox = document.createElement("div");

  Object.assign(hoverPreviewBox.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: "2px solid orange",
    background: "rgba(255,165,0,0.1)",
    pointerEvents: "none",
    zIndex: 2147483646
  });

  manualOverlayLayer.appendChild(hoverPreviewBox);
}

function removeHoverPreview() {
  hoverPreviewBox?.remove();
  hoverPreviewBox = null;
  currentHoverTarget = null;
}

function renderConfirmedSeed(seed) {
  const box = document.createElement("div");

  Object.assign(box.style, {
    position: "fixed",
    left: `${seed.rect.left}px`,
    top: `${seed.rect.top}px`,
    width: `${seed.rect.width}px`,
    height: `${seed.rect.height}px`,
    border: "2px solid yellow",
    background: "rgba(255,255,0,0.15)",
    pointerEvents: "none",
    zIndex: 2147483647
  });

  manualOverlayLayer.appendChild(box);
}

function debugRenderSegmentation() {
  segmentationRegions.forEach(r => {
    const d = document.createElement("div");
    Object.assign(d.style, {
      position: "fixed",
      left: r.rect.left + "px",
      top: r.rect.top + "px",
      width: r.rect.width + "px",
      height: r.rect.height + "px",
      border: "3px solid red",
      pointerEvents: "none",
      zIndex: 999999
    });
    document.body.appendChild(d);
  });
}


function convertSegmentationToEyeBoxes() { 
  eyeBoxes.forEach(b => b.remove()); eyeBoxes = []; segmentationRegions.forEach(region => { 
    const rect = region.rect; 
    const box = createEyeBox( rect.left, rect.top, rect.width, rect.height, 0, 0, region.customId || region.autoId ); 
    box.dataset.selector = region.selector; box.dataset.autoGenerated = "true"; eyeBoxes.push(box); }); toggleEyeBoxes(true); }


function rebuildBox(){ eyeBoxes = eyeBoxes.filter(b => { if (b.dataset.autoGenerated === "true") { b.remove(); return false; } return true; }); }


function exportManualSegmentation() {
  const payload = {
    url: location.href,
    regions: segmentationRegions
  };

  console.log(JSON.stringify(payload, null, 2));
}
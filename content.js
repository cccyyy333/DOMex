let lastTarget = null;
let hoverStartTime = null;
const OVERLAY_DURATION = 100; // 0.1초
const HIGHLIGHT_CLASS = "gaze-highlight-box";
const GAZE_CURSOR_ID = "gaze-cursor";

// 시선 추적용 빨간 점 생성(현재는 마우스 커서 위치)
function createGazeCursor() {
    let cursor = document.getElementById(GAZE_CURSOR_ID);
    if (!cursor) {
        cursor = document.createElement("div");
        cursor.id = GAZE_CURSOR_ID;
        Object.assign(cursor.style, {
            position: "fixed",
            width: "10px",
            height: "10px",
            backgroundColor: "red",
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
    highlight.className = HIGHLIGHT_CLASS;

    Object.assign(highlight.style, {
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: "rgba(255, 0, 0, 0.3)",
        pointerEvents: "none",
        zIndex: 9998
    });

    document.body.appendChild(highlight);
}

// 기존 강조 제거
function removeHighlight() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => el.remove());
}

// 마우스 이동 감지하여 처리
document.addEventListener("mousemove", (event) => {
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





const SUMMARY_BUTTON_ID = "summary-button";

//텍스트 요약 요청 보내기
function sendTextToLLM(textContent) {
  chrome.runtime.sendMessage({
    action: "summarizeText",
    text: textContent
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(" LLM 메시지 전송 실패:", chrome.runtime.lastError.message);
    } else {
      console.log(" 요약 요청 전송 성공", response);
    }
  });
}


document.addEventListener("contextmenu", (e) => {
  const target = e.target;

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
});

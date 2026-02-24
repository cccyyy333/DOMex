console.log("popup loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready");
  const saveBtn = document.getElementById("saveData");
  const visualizeBtn = document.getElementById("visualize");
  const manageBtn = document.getElementById("manage");  

  const gridRowSlider = document.getElementById("gridRows");
  const gridColSlider = document.getElementById("gridCols");

  const segStart = document.getElementById("segStart");
  const segCancel = document.getElementById("segCancel");
  const segFinish = document.getElementById("segFinish");


  //   case "startManualSegmentation":
  //   startManualSegmentation();
  //   break;

  // case "finishManualSegmentation":
  //   finishManualSegmentation();
  //   break;

  // case "cancelManualSegmentation":
  //   cancelManualSegmentation();
  //   break;

  gridRowSlider.addEventListener("input", () => {
  sendGridUpdate();
});
gridColSlider.addEventListener("input", () => {
  sendGridUpdate();
});

  visualizeBtn.addEventListener("click", () => {
    console.log("시선 커서 시각화 버튼 클릭됨");

    // content script로 메시지 전달
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "visualizeCursor" , state: visualizeBtn.checked });
      }
    });
  }); 



  manageBtn.addEventListener("click", () => {
    console.log("관리 버튼 클릭됨");
    const enabled = manageBtn.checked;
    gridRowSlider.disabled = !enabled;
    gridColSlider.disabled = !enabled;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "manage", state: manageBtn.checked });
      }
      });
  }); 

  saveBtn.addEventListener("click", () => {
    console.log("데이터 저장 버튼 클릭됨");

    // background로 전달
    chrome.runtime.sendMessage({ command: "saveData" }, (response) => {
      console.log("Background 응답:", response);
    });
  });
  
function sendGridUpdate() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {
      command: "updateGrid",
      rows: Number(gridRowSlider.value),
      cols: Number(gridColSlider.value)
    });
  });
}


  segStart.addEventListener("click", () => {
    console.log("seg Start");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "startManualSegmentation" });
      }
    });
  }); 

    segCancel.addEventListener("click", () => {
    console.log("seg cancel");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "cancelManualSegmentation" });
      }
    });
  }); 

    segFinish.addEventListener("click", () => {
    console.log("seg finish");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "finishManualSegmentation" });
      }
    });
  }); 



});





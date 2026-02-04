console.log("DOM Extractor 백그라운드 실행됨");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "saveData") {
    // 현재 활성 탭 찾아서 content script로 메시지 전달
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "saveData" });
      }
    });

    sendResponse({ status: "background ok" });
  }
});

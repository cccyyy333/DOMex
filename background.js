console.log("DOM Extractor 백그라운드 실행됨");
chrome.runtime.onMessage.addListener((message) => {
  if (message.command === "saveData") {
    // 현재 활성 탭 찾아서 content script로 메시지 전달
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "saveData" });
      }
    });
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest
    .updateDynamicRules({
      removeRuleIds: [1, 2, 3], // 기존 규칙 제거
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              {
                header: "Cross-Origin-Embedder-Policy",
                operation: "set",
                value: "credentialless",
                //value: "credentialless",
                // "require-corp"
              },
              {
                header: "Cross-Origin-Opener-Policy",
                operation: "set",
                value: "same-origin",
              },
              {
                header: "Cross-Origin-Resource-Policy",
                operation: "set",
                value: "same-origin",
              },
              //{ header: "Content-Security-Policy", operation: "set", value: "script-src 'self' 'unsafe-eval' 'wasm-eval'; worker-src 'self';" }
            ],
          },
          condition: {
            resourceTypes: ["main_frame", "sub_frame"],
          },
        },
      ],
    })
    .then(() => {
      console.log("coi 응답 헤더 적용 완료");
    })
    .catch((error) => {
      console.error("coi 응답 헤더 적용 실패:", error);
    });
});

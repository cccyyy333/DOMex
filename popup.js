document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveData");

  saveBtn.addEventListener("click", () => {
    console.log("데이터 저장 버튼 클릭됨");

    // background로 전달
    chrome.runtime.sendMessage({ command: "saveData" }, (response) => {
      console.log("Background 응답:", response);
    });
  });
});

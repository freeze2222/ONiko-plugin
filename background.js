if (typeof browser === "undefined") {
		var browser = chrome;
}

browser.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if (data) {
		if (data.action === "updateNikoPosition") {
		  // Обновляем положение niko в локальном хранилище
		  browser.storage.local.set({ nikoPosX: data.nikoPosX, nikoPosY: data.nikoPosY });
	  
		  // Отправляем обновление всем вкладкам
		  browser.tabs.query({}).then((tabs) => {
			tabs.forEach((tab) => {
			  browser.tabs.sendMessage(tab.id, {
				action: "setNikoPosition",
				nikoPosX: data.nikoPosX,
				nikoPosY: data.nikoPosY
			  });
			});
		  });
		}
    }
    sendResponse({
        received: true
    });
});
  
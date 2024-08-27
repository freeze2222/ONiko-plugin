if (typeof browser === "undefined") {
	var browser = chrome;
}

browser.runtime.onMessage.addListener((request) => {
    if (request && request.action === "updateNikoPosition") {
        // Update Niko's position in local storage
        const { nikoPosX, nikoPosY } = request;

        browser.storage.local.set({ nikoPosX, nikoPosY });

        // Send update to all tabs
        browser.tabs.query({active: true}).then((tabs) => {
            const message = {
                action: "setNikoPosition",
                nikoPosX,
                nikoPosY
            };
			tabs.forEach((tab) => {
                browser.tabs.sendMessage(tab.id, message);
            });
		});
    }
});

browser.runtime.onMessage.addListener((request) => {
    if (request.action === "updateNikoPosition") {
        // Update Niko's position in local storage
        const { nikoPosX, nikoPosY, mousePosX, mousePosY } = request;

        // Update local storage and send update to all tabs
        browser.storage.local.set({ nikoPosX, nikoPosY, mousePosX, mousePosY }).then(() => {
            const message = {
                action: "setNikoPosition",
                nikoPosX,
                nikoPosY,
                mousePosX,
                mousePosY
            };

            // Send message to all tabs
            return browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                    browser.tabs.sendMessage(tab.id, message);
                });
            });
        });
    }
});

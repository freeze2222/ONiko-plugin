browser.runtime.onMessage.addListener((request, sender) => {
    if (request.action === "updateNikoPosition") {
        // Update Niko's position in local storage
        browser.storage.local.set({
            nikoPosX: request.nikoPosX,
            nikoPosY: request.nikoPosY
        });

        // Send update to all tabs
        browser.tabs.query({}).then((tabs) => {
            tabs.forEach((tab) => {
                browser.tabs.sendMessage(tab.id, {
                    action: "setNikoPosition",
                    nikoPosX: request.nikoPosX,
                    nikoPosY: request.nikoPosY
                });
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const optionsForm = document.getElementById('optionsForm');
    const message = document.getElementById('message');
    const nikoSpeedInput = document.getElementById('nikoSpeed');
    const sleepFrameSpeedInput = document.getElementById('sleepFrameSpeed');
    const idleTimeInput = document.getElementById('idleTime');
    const nikoSpeedValue = document.getElementById('nikoSpeedValue');
    const sleepFrameSpeedValue = document.getElementById('sleepFrameSpeedValue');

    // Add a variable for default values
    const defaultOptions = {
        nikoSpeed: 10,
        sleepFrameSpeed: 0.1,
        idleTime: 60 * 1000 // 60 seconds in milliseconds
    };

    // After loading current settings, add a handler for the reset button
    resetButton.addEventListener('click', () => {
        // Reset values to defaults
        nikoSpeedInput.value = defaultOptions.nikoSpeed;
        sleepFrameSpeedInput.value = defaultOptions.sleepFrameSpeed;
        idleTimeInput.value = Math.floor(defaultOptions.idleTime / 1000); // Convert ms to seconds

        // Update displayed values
        nikoSpeedValue.textContent = nikoSpeedInput.value;
        sleepFrameSpeedValue.textContent = sleepFrameSpeedInput.value;

        // Save default values to storage
        browser.storage.local.set(defaultOptions).then(() => {
            message.textContent = "Settings reset to default.";
            // Send a message to update variables in the main code
            browser.runtime.sendMessage({
                action: "updateOptions",
                options: defaultOptions
            });
        }).catch(error => {
            console.error("Error resetting settings:", error);
            message.textContent = "Error resetting settings.";
        });
    });

    // Load current settings
    browser.storage.local.get(["nikoSpeed", "sleepFrameSpeed", "idleTime"]).then((options) => {
        nikoSpeedInput.value = options.nikoSpeed || 10;
        sleepFrameSpeedInput.value = options.sleepFrameSpeed || 0.1;
        idleTimeInput.value = Math.floor((options.idleTime || 60000) / 1000); // Convert ms to seconds

        // Update displayed values
        nikoSpeedValue.textContent = nikoSpeedInput.value;
        sleepFrameSpeedValue.textContent = sleepFrameSpeedInput.value;
    });

    // Update displayed value when sliders change
    nikoSpeedInput.addEventListener('input', () => {
        nikoSpeedValue.textContent = nikoSpeedInput.value;
    });

    sleepFrameSpeedInput.addEventListener('input', () => {
        sleepFrameSpeedValue.textContent = sleepFrameSpeedInput.value;
    });

    // Handle form submission
    optionsForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const nikoSpeed = parseInt(nikoSpeedInput.value, 10);
        const sleepFrameSpeed = parseFloat(sleepFrameSpeedInput.value);
        const idleTime = parseInt(idleTimeInput.value, 10) * 1000; // Convert seconds to ms

        // Save settings
        const options = {
            nikoSpeed,
            sleepFrameSpeed,
            idleTime
        };

        // Save values in browser.storage.local
        browser.storage.local.set(options).then(() => {
            message.textContent = "Settings saved.";
        }).catch(error => {
            console.error("Error saving settings:", error);
            message.textContent = "Error saving settings.";
        });
    });
});

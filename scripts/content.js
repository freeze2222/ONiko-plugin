(function oniko() {
  const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;

  // Exit if the user prefers reduced motion.
  if (isReducedMotion) return;

  const nikoEl = document.createElement("div");

  if (typeof browser === "undefined") {
	  var browser = chrome;
  }

  // Load Niko's position from local storage.
  browser.storage.local.get(['nikoPosX', 'nikoPosY']).then((result) => {
    let nikoPosX = result.nikoPosX || 32; // Initial X position
    let nikoPosY = result.nikoPosY || 32; // Initial Y position

    let mousePosX = result.mousePosX; // Mouse X position
    let mousePosY = result.mousePosY; // Mouse Y position

    let frameCount = 0; // Frame counter
    let sleepFrameCount = 0; // Frame counter for sleep animation

    const nikoSpeed = 10; // Niko's movement speed
    const sleepFrameSpeed = 0.1; // Speed of sleep frame change (lower is slower)

    let SleepTimer; // Timer for sleep state
    const idleTime = 15000; // 30 seconds
    let isSleeping = false; // Flag to check if Niko is sleeping

    // Sprites.
    const spriteSets = {
      idle: [[0, 0]],
      // Sleep sprites.
      SleepN: [[0, 1], [-1, 1], [-2, 1], [-3, 1]], // Up
      SleepE: [[0, 2], [-1, 2], [-2, 2], [-3, 2]], // Left
      SleepW: [[0, 3], [-1, 3], [-2, 3], [-3, 3]], // Right
      SleepS: [[0, 4], [-1, 4], [-2, 4], [-3, 4]], // Down
      // Up
      N: [[0, 5], [-1, 5], [-2, 5], [-3, 5]],
      NE: [[0, 5], [-1, 5], [-2, 6], [-3, 6]],
      NW: [[0, 5], [-1, 5], [-2, 7], [-3, 7]],
      // Left
      E: [[0, 6], [-1, 6], [-2, 6], [-3, 6]],
      // Right
      W: [[0, 7], [-1, 7], [-2, 7], [-3, 7]],
      // Down
      S: [[0, 0], [-1, 0], [-2, 0], [-3, 0]],
      SE: [[0, 0], [-1, 0], [-2, 6], [-3, 6]],
      SW: [[0, 0], [-1, 0], [-2, 7], [-3, 7]],
    };

    function init() {
      const existingNiko = document.getElementById("oniko");
      
      // Remove existing Niko if present.
      if (existingNiko) {
        existingNiko.remove();
      }

      // Create Niko element.
      nikoEl.id = "oniko";
      nikoEl.ariaHidden = true;
      nikoEl.style.width = "48px";
      nikoEl.style.height = "64px";
      nikoEl.style.position = "fixed";
      nikoEl.style.pointerEvents = "none";
      nikoEl.style.imageRendering = "pixelated";
      nikoEl.style.zIndex = 2147483647;

      // Disable overriding by other css files
      nikoEl.style.setProperty("margin", "0px", "important");
      nikoEl.style.setProperty("padding", "0px", "important");
      nikoEl.style.setProperty("background-color", "transparent", "important");
      nikoEl.style.setProperty("box-shadow", "0px 0px 0px 0px transparent", "important");

      // Set background image for Niko.
      let nikoFile = browser.runtime.getURL("img/oniko.png");
      const curScript = document.currentScript;
      if (curScript && curScript.dataset.cat) {
        nikoFile = curScript.dataset.cat;
      }
      nikoEl.style.backgroundImage = `url(${nikoFile})`;

      browser.storage.local.get(['nikoPosX', 'nikoPosY', 'mousePosX', 'mousePosY']).then((result) => {
        nikoPosX = result.nikoPosX || 32; // Load X position
        nikoPosY = result.nikoPosY || 32; // Load Y position
        mousePosX = result.mousePosX || undefined ; //Load mouse X position
        mousePosY = result.mousePosY || undefined ; //Load mouse Y position
      });

      document.body.appendChild(nikoEl);

      resetSleepTimer(); 
      window.requestAnimationFrame(onAnimationFrame);

      // Track mouse position.
      document.onmousemove = function (event) {
        mousePosX = event.clientX; // Update mouse X position
        mousePosY = event.clientY; // Update mouse Y position
        resetSleepTimer(); // Reset idle timer
        window.requestAnimationFrame(onAnimationFrame); // Start animation frame
      };

      browser.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          nikoPosX = request.nikoPosX; // Get X position
          nikoPosY = request.nikoPosY; // Get Y position
          mousePosX = request.mousePosX;
          mousePosY = request.mousePosY;
        }
      );
    }

    let lastFrameTimestamp;

    // Animate Niko.
    function onAnimationFrame(timestamp) {
      if (!nikoEl.isConnected) return; // Exit if Niko is not in the DOM
      if (!lastFrameTimestamp) lastFrameTimestamp = timestamp; // Initialize timestamp
      if (timestamp - lastFrameTimestamp > 70) {
        lastFrameTimestamp = timestamp; // Update last frame timestamp
        frame(); // Update Niko's position
      }
      window.requestAnimationFrame(onAnimationFrame); // Request the next animation frame
    }

    // Set the sprite based on the current frame.
    function setSprite(name, frame) {
      if (name != undefined){
        const sprite = spriteSets[name][frame % spriteSets[name].length];
        nikoEl.style.backgroundPosition = `${sprite[0] * 48}px ${sprite[1] * 64}px`;
      }
    }

    // Update Niko's animation.
    function frame() {
      frameCount += 3; // Increment frame count
      let diffX = 0;
      let diffY = 0;
      // Calculate distance to mouse.
      if (typeof(mousePosX) != undefined && typeof(mousePosY) != undefined){
        diffX = nikoPosX - mousePosX;
        diffY = nikoPosY - mousePosY;
      } 
      
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      // Check if Niko should go to sleep
      if (distance < 128 && !SleepTimer && !isSleeping) {
        SleepTimer = setTimeout(() => {
          isSleeping = true; // Set sleeping state
          sleepFrameCount = 0; // Reset sleep frame count
        }, idleTime);
      }

      // If Niko is sleeping, update sleep animation
      if (isSleeping) {
        setSprite(getSleepDirection(), Math.floor(sleepFrameCount));
        sleepFrameCount += sleepFrameSpeed; // Increment sleep frame count based on speed
        return;
      }

      // Determine the direction of Niko based on mouse position.
      let direction = undefined;
      if (diffY / distance > 0.5) direction = "N";
      else if (diffY / distance < -0.5) direction = "S";
      else if (diffX / distance > 0.5) direction = "W";
      else if (diffX / distance < -0.5) direction = "E";

      // Stop Niko if he is close to the mouse.
      if (distance < nikoSpeed || distance < 128) {
        setSprite(direction, 0); // Set idle sprite
        return;
      }

      setSprite(direction, frameCount); // Update sprite based on frame count

      // Update Niko's position.
      nikoPosX -= (diffX / distance) * nikoSpeed;
      nikoPosY -= (diffY / distance) * nikoSpeed;

      // Constrain Niko's position within the window.
      nikoPosX = Math.min(Math.max(16, nikoPosX), window.innerWidth - 16);
      nikoPosY = Math.min(Math.max(16, nikoPosY), window.innerHeight - 16);

      updateNikoPosition(); // Update Niko's position on screen
    }

    // Get the direction for sleep animation
    function getSleepDirection() {
      const diffX = nikoPosX - mousePosX;
      const diffY = nikoPosY - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);
      let direction = undefined;

      if (diffY / distance > 0.5) direction = "SleepN";
      else if (diffY / distance < -0.5) direction = "SleepS";
      else if (diffX / distance > 0.5) direction = "SleepW";
      else if (diffX / distance < -0.5) direction = "SleepE";

      return direction;
    }

    // Reset idle timer
    function resetSleepTimer() {
      clearTimeout(SleepTimer);
      SleepTimer = null; // Clear the idle timer
      if (isSleeping) {
        isSleeping = false; // Reset sleeping state
        sleepFrameCount = 0; // Reset sleep frame count
      }
    }

    // Update Niko's position on screen and save it in cache.
    function updateNikoPosition() {

      nikoEl.style.left = `${nikoPosX - 16}px`;
      nikoEl.style.top = `${nikoPosY - 16}px`;

      // Send a message to update Niko's position in other parts of the application.
      browser.runtime.sendMessage({
        action: "updateNikoPosition",
        nikoPosX,
        nikoPosY,
        mousePosX,
        mousePosY
      });

      // Save Niko's current position in cache.
      // browser.storage.local.set({ nikoPosX, nikoPosY, mousePosX, mousePosY });
    }

    // Clean up Niko when the window is about to unload.
    window.addEventListener("beforeunload", function() {
      const existingNiko = document.getElementById("oniko");
      if (existingNiko) {
        existingNiko.remove();
      }
    });

    init(); // Initialize Niko
  });
})();
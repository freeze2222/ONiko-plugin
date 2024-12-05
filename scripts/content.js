(function oniko() {
  const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;

  // Exit if the user prefers reduced motion.
  if (isReducedMotion) return;

  const nikoEl = document.createElement("div");

  // Load Niko's position from local storage.
  browser.storage.local.get(['nikoPosX', 'nikoPosY']).then((result) => {
    let nikoPosX = result.nikoPosX || 32; // Initial X position
    let nikoPosY = result.nikoPosY || 32; // Initial Y position
    let mousePosX = result.mousePosX; // Mouse X position
    let mousePosY = result.mousePosY; // Mouse Y position
    let isSleeping = false; // Flag to check if Niko is sleeping
    let IsMoving = false; // Flag to check if mouse is moving
    let previousDistance = 0; // Needed for IsMoving flag to work
    let dirParam = ""; // Parameter for sprite direction. ("Sleep", "Pat","")
    let direction; // Niko's sprite direction

    let frameCount = 0; // Frame counter
    let sleepFrameCount = 0; // Frame counter for sleep animation
    let patFrameCount = 0; // Frame counter for pat animation

    const nikoSpeed = 10; // Niko's movement speed
    const sleepFrameSpeed = 0.1; // Speed of sleep frame change (lower is slower)
    const patFrameSpeed = 0.5; // Speed of pat frame change (lower is slower)

    let SleepTimer; // Timer for sleep state
    const idleTime = 60000; // 60 seconds

    // Sprites.
    const spriteSets = {
      idle: [[0, 0]],

      SleepN: [[0, 1], [-1, 1], [-2, 1], [-3, 1]], // Up
      SleepE: [[0, 7], [-1, 7], [-2, 7], [-3, 7]], // Left
      SleepW: [[0, 3], [-1, 3], [-2, 3], [-3, 3]], // Right
      SleepS: [[0, 4], [-1, 4], [-2, 4], [-3, 4]], // Down

      PatN: [[0, 1], [-1, 1], [-2, 1], [-3, 1]], // Up
      PatE: [[0, 3], [-1, 3], [-2, 3], [-3, 3]], // Left
      PatW: [[0, 2], [-1, 2], [-2, 2], [-3, 2]], // Right
      PatS: [[0, 4], [-1, 4], [-2, 4], [-3, 4]], // Down 

      N: [[0, 9], [-1, 9], [-2, 9], [-3, 9]], // Up

      E: [[0, 10], [-1, 10], [-2, 10], [-3, 10]], // Right

      W: [[0, 11], [-1, 11], [-2, 11], [-3, 11]], // Left

      S: [[0, 0], [-1, 0], [-2, 0], [-3, 0]], // Down
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

      document.body.appendChild(nikoEl);

      browser.storage.local.get(['nikoPosX', 'nikoPosY', 'mousePosX', 'mousePosY', 'isSleeping']).then((result) => {
        nikoPosX = result.nikoPosX || 32; // Load X position
        nikoPosY = result.nikoPosY || 32; // Load Y position
        mousePosX = result.mousePosX || undefined; //Load mouse X position
        mousePosY = result.mousePosY || undefined; //Load mouse Y position
        isSleeping = result.isSleeping || undefined;
      });

      resetSleepTimer(); 
      window.requestAnimationFrame(onAnimationFrame);

      // Track mouse position.
      document.onmousemove = function (event) {
        mousePosX = event.clientX; // Update mouse X position
        mousePosY = event.clientY; // Update mouse Y position
        resetSleepTimer(); // Reset idle timer
        window.requestAnimationFrame(onAnimationFrame); // Start animation frame
      };
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

    browser.runtime.onMessage.addListener(
      function(request) {
        nikoPosX = request.nikoPosX; // Get X position
        nikoPosY = request.nikoPosY; // Get Y position
        mousePosX = request.mousePosX;
        mousePosY = request.mousePosY;
        isSleeping = request.isSleeping;
      }
    );

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
      let diffX = mousePosX !== undefined ? nikoPosX - mousePosX : 0;
      let diffY = mousePosY !== undefined ? nikoPosY - mousePosY : 0;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      // Check if mouse is moving
      if (distance !== previousDistance) {
        IsMoving = true;
      } else {
        IsMoving = false;
      }

      // Update previousDistance
      previousDistance = distance;

      // Check if Niko should go to sleep
      if (distance < 128 && !SleepTimer && !isSleeping) {
        SleepTimer = setTimeout(() => {
          isSleeping = true; // Set sleeping state
          sleepFrameCount = 0; // Reset sleep frame count
        }, idleTime);
      }

      // Determine the direction of Niko based on mouse position.
      if (distance > 0) {
        if (diffY / distance > 0.5) direction = dirParam + "N";
        else if (diffY / distance < -0.5) direction = dirParam + "S";
        else if (diffX / distance > 0.5) direction = dirParam + "W";
        else if (diffX / distance < -0.5) direction = dirParam + "E";
      }

      // If Niko is sleeping, update sleep animation
      if (isSleeping) {
        dirParam = "Sleep"
        setSprite(direction, Math.floor(sleepFrameCount));
        sleepFrameCount += sleepFrameSpeed; // Increment sleep frame count based on speed
        return;
      }

      // Check if user pats Niko
      if(distance < 32 && IsMoving == true) {
        dirParam = "Pat"
        setSprite(direction, Math.floor(patFrameCount));
        patFrameCount += patFrameSpeed; // Increment pat frame count based on speed
        return;
      }  

      // Stop Niko if he is close to the mouse.
      if (distance < nikoSpeed || distance < 128) {
        setSprite(direction || "idle", 0); // Set idle sprite
        return;
      }

      dirParam = ""
      setSprite(direction, frameCount); // Update sprite based on frame count

      // Update Niko's position.
      nikoPosX -= (diffX / distance) * nikoSpeed;
      nikoPosY -= (diffY / distance) * nikoSpeed;

      // Constrain Niko's position within the window.
      nikoPosX = Math.min(Math.max(16, nikoPosX), window.innerWidth - 16);
      nikoPosY = Math.min(Math.max(16, nikoPosY), window.innerHeight - 16);

      updateNikoPosition(); // Update Niko's position on screen
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
      nikoEl.style.left = `${nikoPosX - 24}px`;
      nikoEl.style.top = `${nikoPosY - 32}px`;

      // Send a message to update Niko's position in other parts of the application.
      browser.runtime.sendMessage({
        action: "updateNikoPosition",
        nikoPosX,
        nikoPosY,
        mousePosX,
        mousePosY,
        isSleeping
      });
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

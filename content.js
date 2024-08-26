(function oniko() {
  if (typeof browser === "undefined") {
	var browser = chrome;
  }
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;

  if (isReducedMotion) return;

  const nikoEl = document.createElement("div");

  browser.storage.local.get(['nikoPosX', 'nikoPosY']).then((result) => {
    let nikoPosX = result.nikoPosX || 32;
    let nikoPosY = result.nikoPosY || 32;

  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  const nikoSpeed = 10;

  const spriteSets = {
    idle: [[0, 0]],
/*    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ], */
    //Up
    N: [
      [0, 1],
      [-1, 1],
      [-2, 1],
      [-3, 1],
    ],
    NE: [
      [0, 1],
      [-1, 1],
      [-2, 2],
      [-3, 2],
    ],
    NW: [
      [0, 1],
      [-1, 1],
      [-2, 3],
      [-3, 3],
    ],

    //Left
    E: [
      [0, 2],
      [-1, 2],
      [-2, 2],
      [-3, 2],
    ],

    //Right
    W: [
      [0, 3],
      [-1, 3],
      [-2, 3],
      [-3, 3],
    ],

    //Down
    S: [
      [0, 0],
      [-1, 0],
      [-2, 0],
      [-3, 0],
    ],
    SE: [
      [0, 0],
      [-1, 0],
      [-2, 2],
      [-3, 2],
    ],
    SW: [
      [0, 0],
      [-1, 0],
      [-2, 3],
      [-3, 3],
    ],
  };


    function init() {
      const existingNiko = document.getElementById("oniko");
      if (existingNiko) {
        existingNiko.remove();
      }

      nikoEl.id = "oniko";
      nikoEl.ariaHidden = true;
      nikoEl.style.width = "48px";
      nikoEl.style.height = "64px";
      nikoEl.style.position = "fixed";
      nikoEl.style.pointerEvents = "none";
      nikoEl.style.imageRendering = "pixelated";
      nikoEl.style.left = `${nikoPosX - 16}px`;
      nikoEl.style.top = `${nikoPosY - 16}px`;
      nikoEl.style.zIndex = 2147483647;

      let nikoFile = browser.runtime.getURL("oniko.png");
      const curScript = document.currentScript;
      if (curScript && curScript.dataset.cat) {
        nikoFile = curScript.dataset.cat;
      }
      nikoEl.style.backgroundImage = `url(${nikoFile})`;

      document.body.appendChild(nikoEl);

      document.addEventListener("mousemove", function (event) {
        mousePosX = event.clientX;
        mousePosY = event.clientY;
      });

      window.requestAnimationFrame(onAnimationFrame);
    }

    let lastFrameTimestamp;

    function onAnimationFrame(timestamp) {
      if (!nikoEl.isConnected) {
        return;
      }
      if (!lastFrameTimestamp) {
        lastFrameTimestamp = timestamp;
      }
      if (timestamp - lastFrameTimestamp > 70) {
        lastFrameTimestamp = timestamp;
        frame();
      }
      window.requestAnimationFrame(onAnimationFrame);
    }

    function setSprite(name, frame) {
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      nikoEl.style.backgroundPosition = `${sprite[0] * 48}px ${sprite[1] * 64}px`;
    }

    function frame() {
      frameCount += 3;
      const diffX = nikoPosX - mousePosX;
      const diffY = nikoPosY - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      let direction = '';
      direction += diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";

      if (distance < nikoSpeed || distance < 128) {
        setSprite(direction, 0);
        return;
      }

      setSprite(direction, frameCount);

      nikoPosX -= (diffX / distance) * nikoSpeed;
      nikoPosY -= (diffY / distance) * nikoSpeed;

      nikoPosX = Math.min(Math.max(16, nikoPosX), window.innerWidth - 16);
      nikoPosY = Math.min(Math.max(16, nikoPosY), window.innerHeight - 16);

      nikoEl.style.left = `${nikoPosX - 16}px`;
      nikoEl.style.top = `${nikoPosY - 16}px`;

      browser.storage.local.set({ nikoPosX: nikoPosX, nikoPosY: nikoPosY });

      browser.runtime.sendMessage({
        action: "updateNikoPosition",
        nikoPosX: nikoPosX,
        nikoPosY: nikoPosY
      });
    }

    browser.runtime.onMessage.addListener((request) => {
      if (request.action === "setNikoPosition") {
        nikoPosX = request.nikoPosX;
        nikoPosY = request.nikoPosY;

        nikoEl.style.left = `${nikoPosX - 16}px`;
        nikoEl.style.top = `${nikoPosY - 16}px`;
      }
    });

    window.addEventListener("beforeunload", function() {
      const existingNiko = document.getElementById("oniko");
      if (existingNiko) {
        existingNiko.remove();
      }
    });

    init();
  });
})();
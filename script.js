// Version 2.3

(function () {
  "use strict";

  const slider = document.getElementById("sunSlider");
  const statusText = document.getElementById("statusText");
  const heatGainValue = document.getElementById("heatGainValue");
  const imageLayers = Array.from(document.querySelectorAll(".image-layer"));
  const raysContainer = document.getElementById("rays");

  const lightOverlay = document.getElementById("lightOverlay");
  const windowGlow = document.getElementById("windowGlow");
  const floorGlow = document.getElementById("floorGlow");
  const roomWarmth = document.getElementById("roomWarmth");

  const MAX_HEAT_GAIN = 12000;

  // Doubled ray count from 12 to 24.
  const raySettings = [
    { top: 6,  delay: 0.0, drift: 0 },
    { top: 9,  delay: 0.3, drift: 14 },
    { top: 12, delay: 0.7, drift: -10 },
    { top: 15, delay: 1.0, drift: 20 },
    { top: 18, delay: 1.4, drift: -18 },
    { top: 21, delay: 1.8, drift: 10 },
    { top: 25, delay: 0.5, drift: -8 },
    { top: 29, delay: 0.9, drift: 16 },
    { top: 33, delay: 1.3, drift: -12 },
    { top: 37, delay: 1.7, drift: 8 },
    { top: 41, delay: 2.1, drift: -16 },
    { top: 45, delay: 2.5, drift: 18 },
    { top: 49, delay: 0.2, drift: -14 },
    { top: 53, delay: 0.6, drift: 12 },
    { top: 57, delay: 1.0, drift: -10 },
    { top: 61, delay: 1.4, drift: 15 },
    { top: 65, delay: 1.8, drift: -8 },
    { top: 69, delay: 2.2, drift: 18 },
    { top: 73, delay: 0.4, drift: -12 },
    { top: 77, delay: 0.8, drift: 10 },
    { top: 81, delay: 1.2, drift: -16 },
    { top: 85, delay: 1.6, drift: 12 },
    { top: 89, delay: 2.0, drift: -8 },
    { top: 93, delay: 2.4, drift: 14 }
  ];

  function createRays() {
    raysContainer.innerHTML = "";

    raySettings.forEach((setting, index) => {
      const ray = document.createElement("div");

      ray.className = "ray";
      ray.style.top = `calc(${setting.top}% + ${setting.drift}px)`;
      ray.style.animationDelay = `${setting.delay}s`;
      ray.dataset.index = String(index);

      raysContainer.appendChild(ray);
    });
  }

  function getStatus(value) {
    if (value === 0) {
      return "No radiant heat transfer";
    }

    if (value < 25) {
      return "Low-intensity solar radiation";
    }

    if (value < 50) {
      return "Moderate solar radiation";
    }

    if (value < 75) {
      return "Medium-high solar radiation";
    }

    return "High-intensity solar radiation";
  }

  function updateHeatGain(value) {
    const heatGain = Math.round((value / 100) * MAX_HEAT_GAIN);
    heatGainValue.textContent = `${heatGain.toLocaleString("en-US")} BTUH`;
  }

  function updateImages(value) {
    if (value === 0) {
      imageLayers.forEach((image, index) => {
        image.style.opacity = index === 0 ? "1" : "0";
      });
      return;
    }

    const normalized = value / 100;
    const scaledPosition = normalized * (imageLayers.length - 1);

    const lowerIndex = Math.floor(scaledPosition);
    const upperIndex = Math.min(lowerIndex + 1, imageLayers.length - 1);
    const blend = scaledPosition - lowerIndex;

    imageLayers.forEach((image, index) => {
      let opacity = 0;

      if (index === lowerIndex) {
        opacity = 1 - blend;
      }

      if (index === upperIndex) {
        opacity = Math.max(opacity, blend);
      }

      image.style.opacity = opacity.toFixed(3);
    });
  }

  function updateOverlays(value) {
    if (value === 0) {
      lightOverlay.style.opacity = "0";
      windowGlow.style.opacity = "0";
      floorGlow.style.opacity = "0";
      roomWarmth.style.opacity = "0";
      return;
    }

    const normalized = value / 100;

    lightOverlay.style.opacity = (normalized * 0.70).toFixed(3);
    windowGlow.style.opacity = (normalized * 0.80).toFixed(3);
    floorGlow.style.opacity = (normalized * 0.78).toFixed(3);
    roomWarmth.style.opacity = (normalized * 0.34).toFixed(3);
  }

  function updateRays(value) {
    const normalized = value / 100;
    const rays = Array.from(document.querySelectorAll(".ray"));

    rays.forEach((ray, index) => {
      if (value === 0) {
        ray.style.display = "none";
        ray.style.setProperty("--ray-opacity", "0");
        return;
      }

      ray.style.display = "block";

      const appearanceThreshold = index / rays.length;
      const visibility = Math.max(
        0,
        Math.min(1, (normalized - appearanceThreshold * 0.72) / 0.28)
      );

      const opacity = visibility * (0.22 + normalized * 0.78);
      const duration = 5.4 - normalized * 3.1 + (index % 3) * 0.18;
      const thickness = 3 + normalized * 5;
      const brightness = 0.75 + normalized * 1.1;

      ray.style.setProperty("--ray-opacity", opacity.toFixed(3));
      ray.style.animationDuration = `${Math.max(1.8, duration).toFixed(2)}s`;
      ray.style.height = `${thickness.toFixed(1)}px`;
      ray.style.filter = `brightness(${brightness.toFixed(2)})`;
    });
  }

  function updateScene() {
    const value = Number(slider.value);

    slider.style.setProperty("--slider-fill", `${value}%`);
    statusText.textContent = getStatus(value);

    updateHeatGain(value);
    updateImages(value);
    updateOverlays(value);
    updateRays(value);
  }

  createRays();
  slider.value = "0";
  updateScene();

  slider.addEventListener("input", updateScene);
})();

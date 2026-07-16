// Version 3.0

(function () {
  "use strict";

  const slider = document.getElementById("timeSlider");
  const statusText = document.getElementById("statusText");
  const heatGainValue = document.getElementById("heatGainValue");
  const selectedTimeValue = document.getElementById("selectedTimeValue");
  const imageLayers = Array.from(document.querySelectorAll(".image-layer"));
  const tickButtons = Array.from(document.querySelectorAll(".time-ticks button"));
  const raysContainer = document.getElementById("rays");
  const lightOverlay = document.getElementById("lightOverlay");
  const windowGlow = document.getElementById("windowGlow");
  const floorGlow = document.getElementById("floorGlow");
  const roomWarmth = document.getElementById("roomWarmth");

  const states = [
    { hour: 7, heat: 0, intensity: 0, status: "No radiant heat transfer" },
    { hour: 8, heat: 3000, intensity: 0.25, status: "Low-intensity solar radiation" },
    { hour: 9, heat: 6000, intensity: 0.5, status: "Moderate solar radiation" },
    { hour: 10, heat: 9000, intensity: 0.75, status: "Medium-high solar radiation" },
    { hour: 11, heat: 12000, intensity: 1, status: "High-intensity solar radiation" }
  ];

  const raySettings = Array.from({ length: 24 }, (_, i) => ({
    top: 6 + i * 3.8,
    delay: (i % 8) * 0.3,
    drift: (i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 3)
  }));

  function createRays() {
    raysContainer.innerHTML = "";
    raySettings.forEach((setting) => {
      const ray = document.createElement("div");
      ray.className = "ray";
      ray.style.top = `calc(${setting.top}% + ${setting.drift}px)`;
      ray.style.animationDelay = `${setting.delay}s`;
      raysContainer.appendChild(ray);
    });
  }

  function updateScene() {
    const hour = Number(slider.value);
    const index = hour - 7;
    const state = states[index];
    const progress = ((hour - 7) / 4) * 100;

    slider.style.setProperty("--slider-fill", `${progress}%`);
    selectedTimeValue.textContent = `${hour} AM`;
    heatGainValue.textContent = `${state.heat.toLocaleString("en-US")} BTUH`;
    statusText.textContent = state.status;

    imageLayers.forEach((img, i) => { img.style.opacity = i === index ? "1" : "0"; });

    lightOverlay.style.opacity = (state.intensity * 0.70).toFixed(3);
    windowGlow.style.opacity = (state.intensity * 0.80).toFixed(3);
    floorGlow.style.opacity = (state.intensity * 0.78).toFixed(3);
    roomWarmth.style.opacity = (state.intensity * 0.34).toFixed(3);

    document.querySelectorAll(".ray").forEach((ray, i) => {
      if (state.intensity === 0) {
        ray.style.display = "none";
        ray.style.setProperty("--ray-opacity", "0");
        return;
      }
      ray.style.display = "block";
      const threshold = i / 24;
      const visibility = Math.max(0, Math.min(1, (state.intensity - threshold * 0.72) / 0.28));
      const opacity = visibility * (0.22 + state.intensity * 0.78);
      ray.style.setProperty("--ray-opacity", opacity.toFixed(3));
      ray.style.animationDuration = `${Math.max(1.8, 5.4 - state.intensity * 3.1 + (i % 3) * 0.18).toFixed(2)}s`;
      ray.style.height = `${(3 + state.intensity * 5).toFixed(1)}px`;
      ray.style.filter = `brightness(${(0.75 + state.intensity * 1.1).toFixed(2)})`;
    });

    tickButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.time) === hour);
    });
  }

  tickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      slider.value = button.dataset.time;
      updateScene();
      slider.focus();
    });
  });

  createRays();
  slider.value = "7";
  updateScene();
  slider.addEventListener("input", updateScene);
})();

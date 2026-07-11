// Version 2.0

(() => {
  "use strict";

  const DESIGN_WIDTH = 1920;
  const DESIGN_HEIGHT = 1080;
  const CROSSFADE_MS = 220;

  const VIDEO_FILES = [
    "./videos/01_no_activity.mp4",
    "./videos/02_low_intensity.mp4",
    "./videos/03_med_low_intensity.mp4",
    "./videos/04_med_high_intensity.mp4",
    "./videos/05_high_intensity.mp4"
  ];

  const STAGE_LABELS = [
    "No activity",
    "First visible bubbling",
    "Light boil",
    "Active boil",
    "Vigorous boil"
  ];

  const REGION_DATA = {
    ambient: {
      name: "Room Air",
      mode: "Convection",
      temperatures: [72, 73, 75, 78, 82],
      explanation:
        "The surrounding air warms gradually as heat is carried away from the burner and pot by natural convection."
    },

    wall: {
      name: "Wall / Background",
      mode: "Radiation and convection",
      temperatures: [72, 73, 75, 78, 82],
      explanation:
        "The wall receives a small amount of radiant heat from the flame and pot while nearby warm air also raises its temperature."
    },

    stoveSurface: {
      name: "Stove Surface",
      mode: "Radiation and conduction",
      temperatures: [78, 84, 92, 105, 120],
      explanation:
        "The stove surface absorbs radiant heat from the flame and conducts heat through the solid cooktop material."
    },

    hotAir: {
      name: "Warm Air Above the Pot",
      mode: "Convection",
      temperatures: [78, 88, 105, 125, 150],
      explanation:
        "Heated air and water vapor become less dense and rise above the pot, carrying thermal energy upward by convection."
    },

    lidHandle: {
      name: "Lid Handle",
      mode: "Conduction",
      temperatures: [92, 105, 125, 145, 165],
      explanation:
        "Heat travels through the metal lid into the handle by conduction. The handle remains cooler because it is farther from the heat source."
    },

    potLid: {
      name: "Pot Lid",
      mode: "Conduction and convection",
      temperatures: [145, 170, 190, 205, 212],
      explanation:
        "The hot pot and steam transfer energy into the lid. Heat spreads through the metal by conduction while hot vapor warms its underside by convection."
    },

    potHandle: {
      name: "Long Pot Handle",
      mode: "Conduction",
      temperatures: [85, 95, 110, 128, 145],
      explanation:
        "Heat conducts from the hot pot body into the metal handle. The temperature decreases farther away from the pot."
    },

    water: {
      name: "Water",
      mode: "Convection",
      temperatures: [180, 212, 212, 212, 212],
      explanation:
        "Water near the heated bottom becomes warmer and rises while cooler water sinks. This circulation transfers heat through the water by convection."
    },

    potBody: {
      name: "Side of the Pot",
      mode: "Conduction",
      temperatures: [175, 205, 230, 255, 280],
      explanation:
        "Heat moves through the solid metal from the hotter bottom toward the sides and upper portions of the pot by conduction."
    },

    potBottom: {
      name: "Bottom of the Pot",
      mode: "Conduction",
      temperatures: [260, 310, 350, 390, 430],
      explanation:
        "The flame heats the bottom surface directly. The metal then conducts energy into the rest of the pot and into the water."
    },

    grate: {
      name: "Burner Grate",
      mode: "Conduction and radiation",
      temperatures: [220, 270, 320, 370, 420],
      explanation:
        "The grate absorbs radiant energy from the flame and conducts heat through the solid metal supports."
    },

    flame: {
      name: "Gas Flame",
      mode: "Radiation and convection",
      temperatures: [1500, 1600, 1700, 1800, 1900],
      explanation:
        "The flame transfers heat to the pot by thermal radiation and by hot combustion gases flowing around the pot."
    }
  };

  const stage = document.getElementById("stage");
  const heatMap = document.getElementById("heatMap");
  const marker = document.getElementById("marker");

  const videoA = document.getElementById("videoA");
  const videoB = document.getElementById("videoB");

  const intensitySlider = document.getElementById("intensitySlider");
  const stageLabel = document.getElementById("stageLabel");

  const regionName = document.getElementById("regionName");
  const temperature = document.getElementById("temperature");
  const transferMode = document.getElementById("transferMode");
  const explanation = document.getElementById("explanation");

  const debugToggle = document.getElementById("debugToggle");

  const startOverlay = document.getElementById("startOverlay");
  const startButton = document.getElementById("startButton");
  const loadStatus = document.getElementById("loadStatus");

  const errorPanel = document.getElementById("errorPanel");
  const errorMessage = document.getElementById("errorMessage");

  let currentStageIndex = 0;
  let activeVideo = videoA;
  let inactiveVideo = videoB;
  let isSwitching = false;
  let queuedStageIndex = null;
  let selectedRegionKey = null;
  let selectedDesignPoint = null;
  let preloadedVideos = [];

  function showError(message) {
    errorMessage.textContent = message;
    errorPanel.hidden = false;
  }

  function hideError() {
    errorPanel.hidden = true;
  }

  function waitForVideoReady(video, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve();
        return;
      }

      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out while loading ${video.currentSrc || video.src}`));
      }, timeoutMs);

      const handleReady = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error(`Could not load ${video.currentSrc || video.src}`));
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("loadeddata", handleReady);
        video.removeEventListener("canplay", handleReady);
        video.removeEventListener("error", handleError);
      };

      video.addEventListener("loadeddata", handleReady, { once: true });
      video.addEventListener("canplay", handleReady, { once: true });
      video.addEventListener("error", handleError, { once: true });
    });
  }

  function createPreloadVideo(src) {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.load();
    return video;
  }

  async function preloadAllVideos() {
    preloadedVideos = VIDEO_FILES.map(createPreloadVideo);

    let loadedCount = 0;
    loadStatus.textContent = `Loading videos 0 of ${VIDEO_FILES.length}…`;

    await Promise.all(
      preloadedVideos.map(async (video) => {
        await waitForVideoReady(video, 15000);
        loadedCount += 1;
        loadStatus.textContent =
          `Loading videos ${loadedCount} of ${VIDEO_FILES.length}…`;
      })
    );

    loadStatus.textContent = "Videos ready.";
  }

  async function primeVisibleVideos() {
    activeVideo.src = VIDEO_FILES[0];
    inactiveVideo.src = VIDEO_FILES[1];

    activeVideo.load();
    inactiveVideo.load();

    await Promise.all([
      waitForVideoReady(activeVideo),
      waitForVideoReady(inactiveVideo)
    ]);

    activeVideo.currentTime = 0;
    inactiveVideo.currentTime = 0;
  }

  async function startInteractive() {
    startButton.disabled = true;
    hideError();

    try {
      await preloadAllVideos();
      await primeVisibleVideos();

      await Promise.all([
        activeVideo.play(),
        inactiveVideo.play()
      ]);

      inactiveVideo.pause();
      inactiveVideo.currentTime = 0;

      intensitySlider.disabled = false;
      startOverlay.classList.add("is-hidden");
    } catch (error) {
      startButton.disabled = false;
      loadStatus.textContent = "Unable to start.";
      showError(
        `${error.message}. Confirm the five MP4 files are inside the videos folder and use H.264 encoding.`
      );
    }
  }

  function sliderToStageIndex(value) {
    const numericValue = Number(value);
    return Math.min(4, Math.floor((numericValue + 12.5) / 25));
  }

  function seekToMatchingLoopPosition(video) {
    if (
      Number.isFinite(activeVideo.duration) &&
      activeVideo.duration > 0 &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      const progress = activeVideo.currentTime / activeVideo.duration;
      video.currentTime = Math.min(
        video.duration - 0.02,
        progress * video.duration
      );
    } else {
      video.currentTime = 0;
    }
  }

  async function switchToStage(stageIndex) {
    const safeIndex = Math.max(0, Math.min(4, stageIndex));

    if (safeIndex === currentStageIndex) {
      return;
    }

    if (isSwitching) {
      queuedStageIndex = safeIndex;
      return;
    }

    isSwitching = true;
    queuedStageIndex = null;

    try {
      inactiveVideo.src = VIDEO_FILES[safeIndex];
      inactiveVideo.load();

      await waitForVideoReady(inactiveVideo);
      seekToMatchingLoopPosition(inactiveVideo);

      await inactiveVideo.play();

      inactiveVideo.classList.add("is-active");
      activeVideo.classList.remove("is-active");

      await new Promise((resolve) => {
        window.setTimeout(resolve, CROSSFADE_MS);
      });

      activeVideo.pause();

      const oldActive = activeVideo;
      activeVideo = inactiveVideo;
      inactiveVideo = oldActive;

      currentStageIndex = safeIndex;
      stageLabel.textContent = STAGE_LABELS[safeIndex];
    } catch (error) {
      showError(error.message);
    } finally {
      isSwitching = false;

      if (
        queuedStageIndex !== null &&
        queuedStageIndex !== currentStageIndex
      ) {
        const nextStage = queuedStageIndex;
        queuedStageIndex = null;
        switchToStage(nextStage);
      }
    }
  }

  function interpolate(a, b, amount) {
    return a + (b - a) * amount;
  }

  function getStageProgress() {
    const exactStage = (Number(intensitySlider.value) / 100) * 4;
    const lowerStage = Math.floor(exactStage);
    const upperStage = Math.min(4, Math.ceil(exactStage));

    return {
      lowerStage,
      upperStage,
      amount: exactStage - lowerStage
    };
  }

  function getBaseTemperature(regionKey) {
    const data = REGION_DATA[regionKey] || REGION_DATA.ambient;
    const { lowerStage, upperStage, amount } = getStageProgress();

    return interpolate(
      data.temperatures[lowerStage],
      data.temperatures[upperStage],
      amount
    );
  }

  function applyPositionGradient(regionKey, baseTemperature, point) {
    if (!point) {
      return baseTemperature;
    }

    const xRatio = point.x / DESIGN_WIDTH;
    const yRatio = point.y / DESIGN_HEIGHT;

    switch (regionKey) {
      case "potHandle": {
        const normalized =
          1 - Math.max(0, Math.min(1, (point.x - 1090) / (1604 - 1090)));
        return baseTemperature + normalized * 45 - 20;
      }

      case "potBody": {
        const normalized =
          Math.max(0, Math.min(1, (point.y - 365) / (864 - 365)));
        return baseTemperature + normalized * 45 - 15;
      }

      case "water": {
        if (Number(intensitySlider.value) >= 13) {
          return 212;
        }

        const normalized =
          Math.max(0, Math.min(1, (point.y - 447) / (788 - 447)));
        return baseTemperature + normalized * 4 - 2;
      }

      case "hotAir":
        return baseTemperature + (1 - yRatio) * 18 - 8;

      case "stoveSurface": {
        const distanceFromBurner = Math.hypot(
          point.x - 740,
          point.y - 900
        );
        const heatFactor = 1 - Math.min(1, distanceFromBurner / 900);
        return baseTemperature + heatFactor * 55;
      }

      case "wall": {
        const distanceFromPot = Math.hypot(
          point.x - 1150,
          point.y - 420
        );
        const heatFactor = 1 - Math.min(1, distanceFromPot / 1000);
        return baseTemperature + heatFactor * 10;
      }

      case "flame":
        return baseTemperature + (0.5 - xRatio) * 80;

      default:
        return baseTemperature;
    }
  }

  function displayRegion(regionKey, point) {
    const data = REGION_DATA[regionKey] || REGION_DATA.ambient;
    const adjustedTemperature = applyPositionGradient(
      regionKey,
      getBaseTemperature(regionKey),
      point
    );

    regionName.textContent = data.name;
    temperature.textContent =
      `${Math.round(adjustedTemperature).toLocaleString()}°F`;
    transferMode.textContent = data.mode;
    explanation.textContent = data.explanation;
  }

  function eventToDesignPoint(event) {
    const rect = heatMap.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * DESIGN_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * DESIGN_HEIGHT
    };
  }

  function positionMarker(event) {
    const stageRect = stage.getBoundingClientRect();

    marker.style.left = `${event.clientX - stageRect.left}px`;
    marker.style.top = `${event.clientY - stageRect.top}px`;
    marker.style.display = "block";
  }

  startButton.addEventListener("click", startInteractive);

  heatMap.addEventListener("pointerdown", (event) => {
    if (intensitySlider.disabled) {
      return;
    }

    const point = eventToDesignPoint(event);
    const regionElement = event.target.closest("[data-region]");
    const regionKey = regionElement
      ? regionElement.dataset.region
      : "ambient";

    selectedRegionKey = regionKey;
    selectedDesignPoint = point;

    positionMarker(event);
    displayRegion(regionKey, point);
  });

  intensitySlider.addEventListener("input", () => {
    const stageIndex = sliderToStageIndex(intensitySlider.value);

    if (stageIndex !== currentStageIndex) {
      switchToStage(stageIndex);
    } else {
      stageLabel.textContent = STAGE_LABELS[stageIndex];
    }

    if (selectedRegionKey) {
      displayRegion(selectedRegionKey, selectedDesignPoint);
    }
  });

  debugToggle.addEventListener("change", () => {
    document.querySelectorAll(".hit-region").forEach((region) => {
      region.classList.toggle("debug", debugToggle.checked);
    });
  });
})();

(function () {
"use strict";
    let plantCameraStream = null;
    let plantCameraOverlay = null;

    function stopPlantCameraStream() {
      if (plantCameraStream) {
        plantCameraStream.getTracks().forEach(track => track.stop());
        plantCameraStream = null;
      }
      if (plantCameraOverlay) {
        plantCameraOverlay.remove();
        plantCameraOverlay = null;
      }
    }

    function capturePlantVideoFrame(video, digitalZoom = 1) {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      const maxEdge = 1280;
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const zoom = Math.max(1, Number(digitalZoom || 1));
      const sourceWidth = width / zoom;
      const sourceHeight = height / zoom;
      const sourceX = (width - sourceWidth) / 2;
      const sourceY = (height - sourceHeight) / 2;
      canvas.getContext("2d").drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error("Could not capture the plant photo."));
            return;
          }
          resolve(new File([blob], `plant-observation-${Date.now()}.jpg`, { type: "image/jpeg", lastModified: Date.now() }));
        }, "image/jpeg", 0.82);
      });
    }

    function plantCameraTouchDistance(touches) {
      if (!touches || touches.length < 2) return 0;
      return Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
    }

    async function setPlantCameraZoom(overlay, requestedZoom) {
      const zoomState = overlay?._plantCameraZoomState;
      if (!zoomState) return;
      const value = Math.min(zoomState.max, Math.max(zoomState.min, Number(requestedZoom || zoomState.min)));
      zoomState.value = value;
      zoomState.output.textContent = `${value.toFixed(value < 2 ? 1 : 0)}x`;
      zoomState.output.classList.add("visible");
      window.clearTimeout(zoomState.indicatorTimer);
      zoomState.indicatorTimer = window.setTimeout(() => zoomState.output.classList.remove("visible"), 650);
      if (zoomState.optical) {
        try {
          await zoomState.track.applyConstraints({ advanced: [{ zoom: value }] });
          zoomState.video.style.transform = "";
          return;
        } catch (error) {
          console.warn("Optical camera zoom was unavailable; using centered digital zoom instead.", error);
          zoomState.optical = false;
          zoomState.min = 1;
          zoomState.max = 4;
          zoomState.step = 0.1;
          zoomState.value = Math.min(4, Math.max(1, value));
        }
      }
      zoomState.output.textContent = `${zoomState.value.toFixed(zoomState.value < 2 ? 1 : 0)}x`;
      zoomState.video.style.transform = `scale(${zoomState.value})`;
    }

    function bindPlantCameraZoom(overlay, video, track) {
      const output = overlay.querySelector("[data-plant-camera-zoom-value]");
      const capabilities = typeof track?.getCapabilities === "function" ? track.getCapabilities() : {};
      const settings = typeof track?.getSettings === "function" ? track.getSettings() : {};
      const optical = Number.isFinite(Number(capabilities?.zoom?.min)) && Number.isFinite(Number(capabilities?.zoom?.max))
        && Number(capabilities.zoom.max) > Number(capabilities.zoom.min);
      const min = optical ? Number(capabilities.zoom.min) : 1;
      const max = optical ? Number(capabilities.zoom.max) : 4;
      const step = optical ? Math.max(0.1, Number(capabilities.zoom.step || 0.1)) : 0.1;
      const value = Math.min(max, Math.max(min, Number(settings?.zoom || min || 1)));
      overlay._plantCameraZoomState = { optical, track, video, output, min, max, step, value, indicatorTimer: 0 };
      output.textContent = `${value.toFixed(value < 2 ? 1 : 0)}x`;
      let pinchDistance = 0;
      let pinchZoom = value;
      video.addEventListener("touchstart", event => {
        if (event.touches.length !== 2) return;
        pinchDistance = plantCameraTouchDistance(event.touches);
        pinchZoom = overlay._plantCameraZoomState?.value || 1;
      }, { passive: true });
      video.addEventListener("touchmove", event => {
        if (event.touches.length !== 2 || !pinchDistance) return;
        event.preventDefault();
        setPlantCameraZoom(overlay, pinchZoom * (plantCameraTouchDistance(event.touches) / pinchDistance));
      }, { passive: false });
      video.addEventListener("touchend", event => {
        if (event.touches.length < 2) pinchDistance = 0;
      }, { passive: true });
      setPlantCameraZoom(overlay, value);
    }

    async function openInAppPlantCamera(section, processPlantPhotoFile, showBanner) {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      stopPlantCameraStream();
      const overlay = document.createElement("div");
      overlay.className = "plant-camera-overlay";
      overlay.innerHTML = `
        <div class="plant-camera-preview"><video autoplay playsinline muted></video><output class="plant-camera-zoom-indicator" data-plant-camera-zoom-value aria-live="polite">1.0x</output></div>
        <div class="plant-camera-controls">
          <p class="plant-camera-help">Frame the plant clearly. Pinch the live image to zoom, then capture. Stay on public paths and do not pick or disturb plants.</p>
          <button class="action" type="button" data-plant-capture>Capture</button>
          <button class="ghost-button" type="button" data-plant-cancel>Cancel</button>
        </div>
      `;
      document.body.appendChild(overlay);
      plantCameraOverlay = overlay;
      const video = overlay.querySelector("video");
      try {
        plantCameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        video.srcObject = plantCameraStream;
        await video.play();
        bindPlantCameraZoom(overlay, video, plantCameraStream.getVideoTracks()[0]);
      } catch (error) {
        stopPlantCameraStream();
        return false;
      }
      overlay.querySelector("[data-plant-cancel]").addEventListener("click", stopPlantCameraStream, { once: true });
      overlay.querySelector("[data-plant-capture]").addEventListener("click", async event => {
        const button = event.currentTarget;
        button.textContent = "Capturing...";
        button.disabled = true;
        try {
          const zoomState = overlay._plantCameraZoomState;
          const file = await capturePlantVideoFrame(video, zoomState?.optical ? 1 : zoomState?.value || 1);
          stopPlantCameraStream();
          await processPlantPhotoFile(section, file);
        } catch (error) {
          showBanner(error.message || "Could not capture that plant photo.");
          stopPlantCameraStream();
        }
      });
      return true;
    }

window.NLI_PLANT_CAMERA = { open: openInAppPlantCamera };
}());

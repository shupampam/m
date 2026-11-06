(() => {
  const audio = document.querySelector("#background-music");
  const button = document.querySelector("#music-toggle");
  const icon = document.querySelector("#music-toggle-icon");
  const preferenceKey = "background-music-enabled";
  let musicEnabled = true;
  let atBottom = false;
  let playAttempt = null;

  try {
    musicEnabled = sessionStorage.getItem(preferenceKey) !== "false";
  } catch {
    musicEnabled = true;
  }

  audio.volume = .25;

  function savePreference() {
    try {
      sessionStorage.setItem(preferenceKey, String(musicEnabled));
    } catch {
      // Playback controls still work if storage is unavailable.
    }
  }

  function isAtPageBottom() {
    const page = document.scrollingElement || document.documentElement;
    const maximumScroll = page.scrollHeight - window.innerHeight;
    return maximumScroll <= 2 || page.scrollTop >= maximumScroll - 2;
  }

  function syncButton() {
    const playing = !audio.paused && !atBottom;
    icon.textContent = playing ? "\u275a\u275a" : "\u25b6";
    button.classList.toggle("is-playing", playing);
    const label = atBottom
      ? (musicEnabled ? "Turn background music off when leaving the bottom" : "Enable background music when scrolling up")
      : (playing ? "Pause background music" : "Play background music");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function stopWaitingForInteraction() {
    document.removeEventListener("pointerdown", resumeOnInteraction);
    document.removeEventListener("keydown", resumeOnInteraction);
  }

  function startPlayback() {
    if (!musicEnabled || atBottom || !audio.paused || playAttempt) return;

    try {
      playAttempt = audio.play();
      if (!playAttempt || typeof playAttempt.then !== "function") {
        playAttempt = null;
        syncButton();
        return;
      }
      playAttempt
        .then(stopWaitingForInteraction)
        .catch(() => {})
        .finally(() => {
          playAttempt = null;
          syncButton();
        });
    } catch {
      playAttempt = null;
    }
    syncButton();
  }

  function resumeOnInteraction(event) {
    if (event.target instanceof Element && event.target.closest("#music-toggle")) return;
    if (musicEnabled && !atBottom) startPlayback();
  }

  function updateScrollState() {
    const nextAtBottom = isAtPageBottom();
    if (nextAtBottom === atBottom) return;

    atBottom = nextAtBottom;
    if (atBottom) {
      audio.pause();
    } else if (musicEnabled) {
      startPlayback();
    }
    syncButton();
  }

  button.addEventListener("click", () => {
    if (atBottom) {
      musicEnabled = !musicEnabled;
      savePreference();
      if (!musicEnabled) audio.pause();
    } else if (musicEnabled && !audio.paused) {
      musicEnabled = false;
      savePreference();
      audio.pause();
    } else {
      musicEnabled = true;
      savePreference();
      startPlayback();
    }
    syncButton();
  });

  audio.addEventListener("play", syncButton);
  audio.addEventListener("pause", syncButton);
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState, { passive: true });
  window.addEventListener("pageshow", updateScrollState);
  document.addEventListener("pointerdown", resumeOnInteraction, { passive: true });
  document.addEventListener("keydown", resumeOnInteraction);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateScrollState, { passive: true });
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateScrollState).observe(document.documentElement);
  }

  updateScrollState();
  startPlayback();
  syncButton();
})();

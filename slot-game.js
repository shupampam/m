(() => {
  const REWARDS = [
    {
      video: "ourlovestory/long_distance_love_site/assets/photos/vids/1d33f110-63c3-47c8-adeb-45ff157a0220.mp4",
      message: "A little moment I'll always remember \u2764\ufe0f",
    },
    {
      video: "ourlovestory/long_distance_love_site/assets/photos/vids/4804de7b-01d6-4ee2-bf98-de380a2855f3.mp4",
      message: "Another memory worth keeping close.",
    },
    {
      video: "ourlovestory/long_distance_love_site/assets/photos/vids/8b0a2750-6ac8-4822-866e-e61b28aa9026.mp4",
      message: "And one more surprise, just for you.",
    },
  ];
  const SYMBOLS = ["\u2764", "\u2726", "\u273f", "\u2728", "\u2665", "\u273f", "\u2764", "\u2726", "\u2665", "\u2728", "\u273f"];
  const STORAGE_KEY = "our-favorite-memories-slot-v2";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const spinButton = document.querySelector("#spin-button");
  const spinCounter = document.querySelector("#spin-counter");
  const spinStatus = document.querySelector("#spin-status");
  const reels = Array.from(document.querySelectorAll(".slot-reel-strip"));
  const cards = document.querySelector("#reward-cards");
  const gamePlay = document.querySelector("#game-play");
  const gameMachineSlot = document.querySelector("#game-machine-slot");
  const finalMachineSlot = document.querySelector("#final-machine-slot");
  const slotMachine = document.querySelector("#slot-machine");
  const finalScreen = document.querySelector("#final-screen");
  const finalGallery = document.querySelector("#unlocked-gallery");
  const giftDialog = document.querySelector("#gift-dialog");
  const giftBox = document.querySelector("#mystery-gift");
  const giftStep = document.querySelector("#gift-step");
  const giftTitle = document.querySelector("#gift-title");
  const giftCaption = document.querySelector("#gift-caption");
  const giftSparkles = document.querySelector("#gift-sparkles");
  const openSurpriseButton = document.querySelector("#open-surprise");
  const videoDialog = document.querySelector("#video-dialog");
  const rewardVideoFrame = document.querySelector("#reward-video-frame");
  const videoMessage = document.querySelector("#video-message");
  const replayButton = document.querySelector("#replay-video");
  let busy = false;
  let pendingTimer = 0;
  let activeRewardIndex = null;
  let rewardVideo = null;

  function loadProgress() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return { spinsUsed: 0, unlocked: [], pending: null };
      const unlocked = [...new Set((Array.isArray(saved.unlocked) ? saved.unlocked : [])
        .filter((index) => Number.isInteger(index) && index >= 0 && index < REWARDS.length))].sort();
      const pending = Number.isInteger(saved.pending) && saved.pending >= 0 && saved.pending < REWARDS.length && !unlocked.includes(saved.pending)
        ? saved.pending
        : null;
      const spinsUsed = Math.min(REWARDS.length, Math.max(unlocked.length + (pending === null ? 0 : 1), Number(saved.spinsUsed) || 0));
      return { spinsUsed, unlocked, pending };
    } catch {
      return { spinsUsed: 0, unlocked: [], pending: null };
    }
  }

  const progress = loadProgress();

  function saveProgress() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      spinStatus.textContent = "Progress is saved for this visit.";
    }
  }

  function createCards() {
    cards.replaceChildren();
    REWARDS.forEach((reward, index) => {
      const unlocked = progress.unlocked.includes(index);
      const card = document.createElement("article");
      card.className = `reward-card${unlocked ? " is-unlocked" : " is-locked"}`;

      const symbol = document.createElement("span");
      symbol.className = "reward-card-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = unlocked ? "\u2764" : "\u2726";
      card.append(symbol);

      const label = document.createElement("span");
      label.className = "reward-card-label";
      label.textContent = `REWARD 0${index + 1}`;
      card.append(label);

      const state = document.createElement("span");
      state.className = "reward-card-state";
      state.textContent = unlocked ? "UNLOCKED" : "MYSTERY";
      card.append(state);

      if (unlocked) {
        const watchButton = document.createElement("button");
        watchButton.className = "watch-again-button";
        watchButton.type = "button";
        watchButton.dataset.reward = String(index);
        watchButton.textContent = "WATCH AGAIN";
        card.append(watchButton);
      }
      cards.append(card);
    });
  }

  function createFinalGallery() {
    finalGallery.replaceChildren();
    REWARDS.forEach((reward, index) => {
      const memory = document.createElement("article");
      memory.className = "final-memory";
      const message = document.createElement("p");
      message.textContent = reward.message;
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "none";
      video.setAttribute("aria-label", `Unlocked memory ${index + 1}`);
      video.src = reward.video;
      memory.append(message, video);
      finalGallery.append(memory);
    });
  }

  function updateView() {
    const remaining = REWARDS.length - progress.spinsUsed;
    spinCounter.textContent = `${remaining} FREE ${remaining === 1 ? "SPIN" : "SPINS"} LEFT`;
    spinButton.disabled = busy || progress.pending !== null || remaining === 0;
    if (progress.unlocked.length === REWARDS.length) {
      finalMachineSlot.append(slotMachine);
      gamePlay.hidden = true;
      finalScreen.hidden = false;
      spinStatus.textContent = "All three surprises are unlocked.";
      if (!finalGallery.childElementCount) createFinalGallery();
      return;
    }
    gameMachineSlot.append(slotMachine);
    gamePlay.hidden = false;
    finalScreen.hidden = true;
    createCards();
    if (progress.pending !== null) {
      spinStatus.textContent = "Your surprise is ready to open.";
    } else if (remaining === 0) {
      spinStatus.textContent = "Your three surprises are waiting below.";
    } else {
      spinStatus.textContent = "One spin, one special memory.";
    }
  }

  function fillSparkles() {
    const marks = ["\u2726", "\u2727", "\u2665", "\u2728", "\u00b7", "\u2726", "\u2665", "\u2727", "\u2728", "\u2726", "\u2665", "\u2727"];
    giftSparkles.replaceChildren();
    marks.forEach((mark, index) => {
      const sparkle = document.createElement("span");
      sparkle.className = "gift-sparkle";
      sparkle.textContent = mark;
      sparkle.style.setProperty("--sparkle-x", `${(index * 37 + 8) % 94}%`);
      sparkle.style.setProperty("--sparkle-y", `${(index * 53 + 7) % 90}%`);
      sparkle.style.setProperty("--sparkle-size", `${11 + index % 4 * 4}px`);
      sparkle.style.setProperty("--sparkle-duration", `${.8 + index % 5 * .25}s`);
      sparkle.style.setProperty("--sparkle-color", index % 2 ? "#f3c88e" : "#efb7ad");
      giftSparkles.append(sparkle);
    });
  }

  function showGift(index) {
    activeRewardIndex = index;
    giftStep.textContent = `SURPRISE 0${index + 1} OF 03`;
    giftTitle.textContent = "Your surprise is waiting";
    giftCaption.textContent = "I wonder what could be inside...";
    giftBox.classList.remove("is-opening");
    openSurpriseButton.hidden = true;
    openSurpriseButton.disabled = false;
    fillSparkles();
    if (!giftDialog.open) giftDialog.showModal();
    window.clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(() => {
      openSurpriseButton.hidden = false;
      openSurpriseButton.focus();
    }, reducedMotion.matches ? 50 : 1250);
  }

  function openVideo(index) {
    activeRewardIndex = index;
    videoMessage.textContent = REWARDS[index].message;
    rewardVideo = document.createElement("video");
    rewardVideo.controls = true;
    rewardVideo.playsInline = true;
    rewardVideo.preload = "metadata";
    rewardVideo.src = REWARDS[index].video;
    rewardVideo.setAttribute("aria-label", `Unlocked memory ${index + 1}`);
    rewardVideoFrame.replaceChildren(rewardVideo);
    rewardVideo.load();
    if (!videoDialog.open) videoDialog.showModal();
    rewardVideo.play().catch(() => {});
  }

  function clearRewardVideo() {
    if (!rewardVideo) return;
    rewardVideo.pause();
    rewardVideo.removeAttribute("src");
    rewardVideo.load();
    rewardVideo.remove();
    rewardVideo = null;
  }

  function closeRewardVideo() {
    clearRewardVideo();
    if (videoDialog.open) videoDialog.close();
  }

  function stopReels() {
    const stopTargets = reels.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    const totalRows = SYMBOLS.length;
    reels.forEach((reel, reelIndex) => {
      const rows = Array.from({ length: totalRows }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      rows[totalRows - 1] = stopTargets[reelIndex];
      reel.replaceChildren(...rows.map((symbol) => {
        const row = document.createElement("span");
        row.textContent = symbol;
        return row;
      }));
      reel.style.transition = "none";
      reel.style.transform = "translateY(0)";
      void reel.offsetHeight;
      const rowHeight = reel.firstElementChild.getBoundingClientRect().height;
      if (reducedMotion.matches) {
        reel.style.transform = `translateY(-${(totalRows - 1) * rowHeight}px)`;
      } else {
        const duration = 1050 + reelIndex * 330;
        reel.style.transition = `transform ${duration}ms cubic-bezier(.12,.72,.16,1)`;
        reel.style.transform = `translateY(-${(totalRows - 1) * rowHeight}px)`;
      }
    });
    return reducedMotion.matches ? 150 : 2200;
  }

  function spin() {
    if (busy || progress.pending !== null || progress.spinsUsed >= REWARDS.length) return;
    const rewardIndex = REWARDS.findIndex((_, index) => !progress.unlocked.includes(index));
    if (rewardIndex < 0) return;

    busy = true;
    progress.spinsUsed += 1;
    progress.pending = rewardIndex;
    saveProgress();
    updateView();
    spinStatus.textContent = "The reels are choosing your surprise...";
    const animationDuration = stopReels();
    window.setTimeout(() => {
      busy = false;
      updateView();
      showGift(rewardIndex);
    }, animationDuration);
  }

  function revealReward() {
    if (activeRewardIndex === null || progress.pending !== activeRewardIndex) return;
    openSurpriseButton.disabled = true;
    giftBox.classList.add("is-opening");
    giftTitle.textContent = "A memory, just for you";
    giftCaption.textContent = "A little piece of us, kept close.";
    const revealDelay = reducedMotion.matches ? 30 : 1000;
    window.setTimeout(() => {
      const rewardIndex = activeRewardIndex;
      if (!progress.unlocked.includes(rewardIndex)) progress.unlocked.push(rewardIndex);
      progress.pending = null;
      progress.unlocked.sort();
      saveProgress();
      updateView();
      giftDialog.close();
      openVideo(rewardIndex);
    }, revealDelay);
  }

  spinButton.addEventListener("click", spin);
  openSurpriseButton.addEventListener("click", revealReward);
  cards.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reward]");
    if (!button) return;
    const index = Number(button.dataset.reward);
    if (progress.unlocked.includes(index)) openVideo(index);
  });
  giftDialog.addEventListener("cancel", (event) => event.preventDefault());
  document.querySelector("#close-video").addEventListener("click", closeRewardVideo);
  videoDialog.addEventListener("close", clearRewardVideo);
  replayButton.addEventListener("click", () => {
    if (!rewardVideo) return;
    rewardVideo.currentTime = 0;
    rewardVideo.play().catch(() => {});
  });

  updateView();
  if (progress.pending !== null) showGift(progress.pending);
})();

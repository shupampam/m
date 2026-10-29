(() => {
  const canvas = document.querySelector(".garden");
  const foliageCanvas = document.querySelector(".foliage");
  const sceneContext = canvas.getContext("2d", { alpha: false });
  const foliageContext = foliageCanvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const letterGate = document.querySelector("#letter-gate");
  const envelopeView = document.querySelector("#envelope-view");
  const openLetterButton = document.querySelector("#open-letter");
  const loveLetter = document.querySelector("#love-letter");
  const finishLetterButton = document.querySelector("#finish-letter");
  let ctx = sceneContext;
  const capybaraImage = new Image();
  capybaraImage.src = new URL("./ourlovestory/long_distance_love_site/assets/photos/cappy.png", window.location.href).href;
  const roadsidePhotos = Array.from({ length: 58 }, (_, index) => {
    const pairIndex = Math.floor(index / 2);
    return { image: new Image(), z: 20 + pairIndex * 4.45 + (index % 2) * .25, index, shownAt: null };
  });

  const plants = [];
  const petals = [];
  const groundTufts = [];
  const pathGrains = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let scrollProgress = 0;
  let currentProgress = 0;
  let pointerX = 0;
  let pointerTarget = 0;
  let lastTime = 0;
  let presentationFrame = 0;
  let savedScrollBehavior = "";

  let seed = 81427;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 760; i++) {
    const z = 4 + random() * 250;
    const side = random() < .5 ? -1 : 1;
    const distance = 1.6 + random() * 19;
    plants.push({
      z,
      x: side * distance,
      size: .58 + random() * 1.5,
      type: random(),
      hue: random(),
      sway: random() * Math.PI * 2,
    });
  }
  plants.sort((a, b) => b.z - a.z);
  for (let i = 0; i < 34; i++) {
    petals.push({
      x: random(),
      y: random(),
      speed: .018 + random() * .035,
      drift: .018 + random() * .035,
      phase: random() * Math.PI * 2,
      size: 2 + random() * 4,
    });
  }
  for (let i = 0; i < 1750; i++) {
    groundTufts.push({
      x: (random() * 2 - 1) * 24,
      z: 2 + random() * 250,
      size: .035 + random() * .11,
      hue: random(),
      lean: (random() - .5) * 1.5,
    });
  }
  for (let i = 0; i < 1500; i++) {
    pathGrains.push({
      x: (random() * 2 - 1) * .92,
      z: 2 + random() * 250,
      size: .012 + random() * .055,
      tone: random(),
      rotation: random() * Math.PI,
    });
  }

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    foliageCanvas.width = canvas.width;
    foliageCanvas.height = canvas.height;
    foliageContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function updateScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }

  function restoreScrollBehavior() {
    document.documentElement.style.scrollBehavior = savedScrollBehavior;
  }

  function stopPresentation() {
    if (!presentationFrame) return;
    cancelAnimationFrame(presentationFrame);
    presentationFrame = 0;
    restoreScrollBehavior();
  }

  function startPresentation() {
    document.documentElement.classList.remove("letter-locked");
    letterGate.hidden = true;
    if (prefersReducedMotion.matches) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      updateScroll();
      restoreScrollBehavior();
      return;
    }

    const duration = 32000;
    let startedAt = 0;
    const advance = (time) => {
      if (!startedAt) startedAt = time;
      const progress = Math.min(1, (time - startedAt) / duration);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, maxScroll * progress);
      if (progress < 1) {
        presentationFrame = requestAnimationFrame(advance);
      } else {
        presentationFrame = 0;
        restoreScrollBehavior();
      }
    };
    presentationFrame = requestAnimationFrame(advance);
  }

  function finishReading() {
    letterGate.classList.add("is-leaving");
    window.setTimeout(startPresentation, prefersReducedMotion.matches ? 0 : 650);
  }

  function pathCenter(z) {
    return Math.sin(z * .047) * 2.5 + Math.sin(z * .113) * .75;
  }

  function project(x, z, cameraZ, cameraX, focal, horizon, cameraHeight) {
    const depth = z - cameraZ;
    if (depth <= 1) return null;
    const scale = focal / depth;
    return {
      x: width / 2 + (x - cameraX) * scale,
      y: horizon + cameraHeight * scale,
      scale,
    };
  }

  function drawSky(progress, horizon) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon * 1.35);
    const dusk = progress > .65;
    sky.addColorStop(0, dusk ? "#49334d" : "#9c7986");
    sky.addColorStop(.48, dusk ? "#a56878" : "#e6a18f");
    sky.addColorStop(1, dusk ? "#f0ac86" : "#f7c596");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const sunX = width * (.72 - progress * .23);
    const sunY = horizon * .48;
    const glow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, height * .38);
    glow.addColorStop(0, "rgba(255,231,190,.65)");
    glow.addColorStop(.22, "rgba(255,193,166,.2)");
    glow.addColorStop(1, "rgba(255,193,166,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - height * .32, sunY - height * .32, height * .64, height * .64);

    ctx.fillStyle = dusk ? "rgba(255,215,184,.9)" : "rgba(255,239,210,.95)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.max(12, height * .027), 0, Math.PI * 2);
    ctx.fill();

  }

  function drawPath(cameraZ, cameraX, focal, horizon, cameraHeight) {
    const left = [];
    const right = [];
    for (let z = cameraZ + 1.5; z <= cameraZ + 130; z += 2) {
      const distance = z - cameraZ;
      const halfWidth = 1.1 + distance * .035;
      const center = pathCenter(z);
      const l = project(center - halfWidth, z, cameraZ, cameraX, focal, horizon, cameraHeight);
      const r = project(center + halfWidth, z, cameraZ, cameraX, focal, horizon, cameraHeight);
      if (l && r) { left.push(l); right.push(r); }
    }
    if (!left.length) return;
    const path = ctx.createLinearGradient(0, horizon, 0, height);
    path.addColorStop(0, "#92705f");
    path.addColorStop(.38, "#b08a70");
    path.addColorStop(1, "#d0a889");
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (const point of left) ctx.lineTo(point.x, point.y);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fillStyle = path;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,221,197,.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < left.length; i++) {
      if (i === 0) ctx.moveTo(left[i].x, left[i].y);
      else ctx.lineTo(left[i].x, left[i].y);
    }
    for (let i = 0; i < right.length; i++) {
      if (i === 0) ctx.moveTo(right[i].x, right[i].y);
      else ctx.lineTo(right[i].x, right[i].y);
    }
    ctx.stroke();
  }

  function isInPond(point, pond, margin = 1) {
    if (!pond) return false;
    const x = (point.x - pond.point.x) / (pond.rx * margin);
    const y = (point.y - pond.point.y) / (pond.ry * margin);
    return x * x + y * y < 1;
  }

  function drawGroundTexture(cameraZ, cameraX, focal, horizon, cameraHeight, pond) {
    for (const tuft of groundTufts) {
      const depth = tuft.z - cameraZ;
      if (depth <= 1) continue;
      const pathHalfWidth = 1.1 + depth * .035;
      if (Math.abs(tuft.x) < pathHalfWidth + .2) continue;

      const point = project(tuft.x + pathCenter(tuft.z), tuft.z, cameraZ, cameraX, focal, horizon, cameraHeight);
      if (!point || point.y < horizon || point.y > height + 12 || point.x < -12 || point.x > width + 12) continue;
      if (isInPond(point, pond, 1.15)) continue;

      const blade = Math.min(10, point.scale * tuft.size);
      const color = Math.round(91 + tuft.hue * 42);
      ctx.strokeStyle = `rgba(${color + 12},${color + 28},${color + 2},${Math.min(.76, .28 + point.scale * .02)})`;
      ctx.lineWidth = Math.max(.65, Math.min(2, point.scale * .012));
      for (let bladeIndex = -1; bladeIndex <= 1; bladeIndex++) {
        const offsetX = bladeIndex * blade * .28;
        const lean = tuft.lean + bladeIndex * .45;
        ctx.beginPath();
        ctx.moveTo(point.x + offsetX, point.y);
        ctx.quadraticCurveTo(
          point.x + offsetX + lean * blade * .45,
          point.y - blade * .48,
          point.x + offsetX + lean * blade,
          point.y - blade,
        );
        ctx.stroke();
      }

      if (tuft.hue > .87 && point.scale > 12) {
        ctx.fillStyle = `rgba(236,161,166,${Math.min(.72, .28 + point.scale * .012)})`;
        ctx.beginPath();
        ctx.ellipse(point.x, point.y - blade, Math.max(.65, blade * .13), Math.max(.5, blade * .09), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPathTexture(cameraZ, cameraX, focal, horizon, cameraHeight) {
    for (const grain of pathGrains) {
      const depth = grain.z - cameraZ;
      if (depth <= 1) continue;
      const offset = grain.x * (1.1 + depth * .035);
      const point = project(pathCenter(grain.z) + offset, grain.z, cameraZ, cameraX, focal, horizon, cameraHeight);
      if (!point || point.y < horizon || point.y > height + 14 || point.x < -14 || point.x > width + 14) continue;

      const size = Math.min(4, Math.max(.45, point.scale * grain.size));
      ctx.fillStyle = grain.tone > .65 ? "rgba(250,215,188,.24)" : "rgba(82,53,48,.16)";
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, size, Math.max(.4, size * .34), grain.rotation, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlant(plant, cameraZ, cameraX, focal, horizon, cameraHeight, time, pond) {
    const worldZ = plant.z;
    const point = project(plant.x + pathCenter(worldZ), worldZ, cameraZ, cameraX, focal, horizon, cameraHeight);
    if (!point || point.x < -90 || point.x > width + 90 || point.y > height + 80) return;

    const s = Math.min(point.scale * plant.size, height * .72);
    if (isInPond(point, pond, 1.3)) return;
    const groundY = point.y;
    const sway = Math.sin(time * .0007 + plant.sway) * s * .045;
    const isTree = plant.type > .88;
    const isFern = plant.type > .58 && !isTree;
    const depth = (worldZ - cameraZ) / 120;
    const green = Math.round(44 + depth * 30 + plant.hue * 24);

    if (isTree) {
      ctx.fillStyle = `rgba(${42 + plant.hue * 20},${50 + depth * 22},${34 + plant.hue * 12},.98)`;
      ctx.fillRect(point.x - s * .065, groundY - s * .72, s * .13, s * .72);
      for (let i = 0; i < 5; i++) {
        const crownX = point.x + Math.sin(i * 2.4 + plant.sway) * s * .21;
        const crownY = groundY - s * (.64 + (i % 3) * .1);
        const radius = s * (.24 + (i % 2) * .06);
        ctx.fillStyle = `rgb(${34 + i * 3},${green + i * 3},${37 + i * 2})`;
        ctx.beginPath();
        ctx.arc(crownX, crownY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (isFern) {
      ctx.strokeStyle = `rgb(${37},${green + 15},${49})`;
      ctx.lineWidth = Math.max(.7, s * .025);
      for (let frond = 0; frond < 6; frond++) {
        const direction = frond / 5 * Math.PI - Math.PI / 2;
        const length = s * (.48 + (frond % 3) * .1);
        ctx.beginPath();
        ctx.moveTo(point.x, groundY);
        ctx.quadraticCurveTo(point.x + Math.cos(direction) * length * .35 + sway, groundY - length * .52,
          point.x + Math.cos(direction) * length, groundY - length);
        ctx.stroke();
        for (let leaf = 1; leaf <= 4; leaf++) {
          const t = leaf / 5;
          const lx = point.x + Math.cos(direction) * length * t;
          const ly = groundY - length * t;
          const leafSize = s * .105 * (1 - t * .45);
          ctx.fillStyle = `rgb(${48 + leaf * 2},${green + leaf * 3},${51 + leaf})`;
          ctx.beginPath();
          ctx.ellipse(lx - leafSize, ly - leafSize * .2, leafSize, leafSize * .42, -.5, 0, Math.PI * 2);
          ctx.ellipse(lx + leafSize, ly - leafSize * .2, leafSize, leafSize * .42, .5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    const stemHeight = s * (.45 + plant.hue * .35);
    ctx.strokeStyle = `rgb(63,${green + 22},${55})`;
    ctx.lineWidth = Math.max(.7, s * .022);
    ctx.beginPath();
    ctx.moveTo(point.x, groundY);
    ctx.quadraticCurveTo(point.x + sway, groundY - stemHeight * .55, point.x + sway, groundY - stemHeight);
    ctx.stroke();

    if (plant.type > .35) {
      const flowerX = point.x + sway;
      const flowerY = groundY - stemHeight;
      const colors = ["#f0a2a3", "#d87b88", "#fff0df", "#e69caa", "#f4c18c"];
      const petal = s * .055;
      ctx.fillStyle = colors[Math.floor(plant.hue * colors.length)];
      for (let petalIndex = 0; petalIndex < 5; petalIndex++) {
        const angle = petalIndex * Math.PI * 2 / 5;
        ctx.beginPath();
        ctx.ellipse(flowerX + Math.cos(angle) * petal * .8, flowerY + Math.sin(angle) * petal * .8,
          petal * .65, petal * .43, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#d5b568";
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, Math.max(.7, petal * .28), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function getPondProjection(cameraZ, cameraX, focal, horizon, cameraHeight) {
    const pondZ = 75;
    const point = project(pathCenter(pondZ) + 10, pondZ, cameraZ, cameraX, focal, horizon, cameraHeight);
    if (!point || point.y > height + 140 || point.y < horizon) return null;
    return { point, rx: point.scale * 6, ry: point.scale * 1.25 };
  }

  function drawPond(pond) {
    if (!pond) return;
    const { point, rx, ry } = pond;
    const water = ctx.createLinearGradient(point.x - rx, point.y - ry, point.x + rx, point.y + ry);
    water.addColorStop(0, "rgba(212,158,153,.91)");
    water.addColorStop(.55, "rgba(143,123,137,.95)");
    water.addColorStop(1, "rgba(79,92,103,.92)");
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, rx, ry, -.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,220,192,.55)";
    ctx.lineWidth = Math.max(1, point.scale * .04);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,233,218,.56)";
    ctx.lineWidth = Math.max(.6, point.scale * .025);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(point.x - rx * .18, point.y + i * ry * .23, rx * (.2 + i * .06), ry * .12, -.06, .2, 2.8);
      ctx.stroke();
    }

    if (capybaraImage.complete && capybaraImage.naturalWidth > 0) {
      const imageSize = rx * 2.4;
      ctx.drawImage(capybaraImage, point.x - imageSize / 2, point.y - imageSize * .9, imageSize, imageSize);
    }
  }

  function drawRoadsidePhotos(cameraZ, cameraX, focal, horizon, cameraHeight, time) {
    const targetDepth = 15;
    const pairSpacing = 4.45;
    const pairCount = roadsidePhotos.length / 2;
    const pairIndex = Math.max(0, Math.min(
      pairCount - 1,
      Math.round((cameraZ + targetDepth - 20) / pairSpacing),
    ));

    for (let side = -1; side <= 1; side += 2) {
      const photo = roadsidePhotos[pairIndex * 2 + (side < 0 ? 1 : 0)];
      const depth = photo.z - cameraZ;
      if (depth <= 1 || Math.abs(depth - targetDepth) > pairSpacing / 2 + .1) continue;
      if (!photo.image.src) {
        photo.image.src = new URL(`./ourlovestory/long_distance_love_site/assets/photos/pic/${photo.index + 1}.jpg`, window.location.href).href;
        continue;
      }
      if (!photo.image.complete || !photo.image.naturalWidth) continue;

      const scaleEstimate = focal / depth;
      const frameWidth = Math.min(2.5, width * .1 / scaleEstimate);
      const frameHeight = frameWidth * 1.36;
      const roadHalfWidth = 1.1 + depth * .035;
      const x = pathCenter(photo.z) + side * (roadHalfWidth + frameWidth / 2 + 3.2);
      const point = project(x, photo.z, cameraZ, cameraX, focal, horizon, cameraHeight);
      if (!point || point.y < horizon || point.y > height + 100) continue;

      const scaledWidth = point.scale * frameWidth;
      const scaledHeight = point.scale * frameHeight;
      const left = point.x - scaledWidth / 2;
      const top = point.y - scaledHeight;
      if (left > width || left + scaledWidth < 0) continue;
      const frame = Math.max(1, point.scale * .13);
      const inset = Math.max(.8, point.scale * .1);
      const availableWidth = scaledWidth - frame * 2 - inset * 2;
      const availableHeight = scaledHeight - frame * 2 - inset * 2;
      const imageRatio = photo.image.naturalWidth / photo.image.naturalHeight;
      const imageWidth = Math.min(availableWidth, availableHeight * imageRatio);
      const imageHeight = Math.min(availableHeight, availableWidth / imageRatio);
      if (photo.shownAt === null) photo.shownAt = time;
      const motionProgress = prefersReducedMotion.matches
        ? 1
        : Math.min(1, (time - photo.shownAt) / 650);
      const easedProgress = 1 - Math.pow(1 - motionProgress, 3);
      const popScale = .78 + easedProgress * .22;
      const popLift = point.scale * (1 - easedProgress) * .28;

      ctx.save();
      ctx.globalAlpha = easedProgress;
      ctx.translate(point.x, point.y - popLift);
      ctx.scale(popScale, popScale);
      ctx.strokeStyle = "#74523f";
      ctx.lineWidth = Math.max(1.5, point.scale * .16);
      ctx.beginPath();
      ctx.moveTo(0, -point.scale * .15);
      ctx.lineTo(0, point.scale * .8);
      ctx.stroke();

      ctx.shadowColor = "rgba(36, 24, 28, .42)";
      ctx.shadowBlur = Math.max(3, point.scale * .65);
      ctx.shadowOffsetY = Math.max(2, point.scale * .25);
      ctx.fillStyle = "#d6b386";
      ctx.fillRect(-scaledWidth / 2, -scaledHeight, scaledWidth, scaledHeight);
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#4a3435";
      ctx.fillRect(-scaledWidth / 2 + frame, -scaledHeight + frame, scaledWidth - frame * 2, scaledHeight - frame * 2);
      ctx.drawImage(
        photo.image,
        -imageWidth / 2,
        -scaledHeight + (scaledHeight - imageHeight) / 2,
        imageWidth,
        imageHeight,
      );
      ctx.strokeStyle = "rgba(255, 237, 208, .88)";
      ctx.lineWidth = Math.max(.8, point.scale * .08);
      ctx.strokeRect(-scaledWidth / 2, -scaledHeight, scaledWidth, scaledHeight);
      ctx.restore();
    }
  }

  function drawChibi(point, time, character, phase) {
    const scale = point.scale * .58;
    const stride = Math.sin(time * .006 + phase);
    const bounce = Math.abs(Math.sin(time * .006 + phase)) * .055;
    const outline = "rgba(57, 39, 42, .94)";
    const faceY = -2.17 - bounce;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(33, 25, 30, .28)";
    ctx.beginPath();
    ctx.ellipse(0, -.025, .57, .13, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawLimb = (fromX, fromY, toX, toY, thickness, light, mid, shade) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = outline;
      ctx.lineWidth = thickness + .09;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      const gradient = ctx.createLinearGradient(fromX - thickness / 2, fromY, fromX + thickness / 2, toY);
      gradient.addColorStop(0, light);
      gradient.addColorStop(.56, mid);
      gradient.addColorStop(1, shade);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    };

    const legSwing = stride * .34;
    drawLimb(-.19, -.77 - bounce, -.31 - legSwing, -.17, .33,
      character.pantsLight, character.pants, character.pantsShade);
    drawLimb(.19, -.77 - bounce, .31 + legSwing, -.17, .33,
      character.pantsLight, character.pants, character.pantsShade);

    ctx.fillStyle = character.shoeShade;
    ctx.strokeStyle = outline;
    ctx.lineWidth = .055;
    ctx.beginPath();
    ctx.ellipse(-.34 - legSwing, -.12, .28, .13, -.12, 0, Math.PI * 2);
    ctx.ellipse(.34 + legSwing, -.12, .28, .13, .12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = character.shoes;
    ctx.beginPath();
    ctx.ellipse(-.35 - legSwing, -.16, .26, .105, -.12, Math.PI, Math.PI * 2);
    ctx.ellipse(.35 + legSwing, -.16, .26, .105, .12, Math.PI, Math.PI * 2);
    ctx.fill();

    if (character.longHair) {
      const backHair = ctx.createLinearGradient(-.7, -2.95, .72, -1.1);
      backHair.addColorStop(0, character.hairLight);
      backHair.addColorStop(.45, character.hair);
      backHair.addColorStop(1, character.hairShade);
      ctx.fillStyle = backHair;
      ctx.strokeStyle = outline;
      ctx.lineWidth = .075;
      ctx.beginPath();
      ctx.moveTo(-.45, -2.58 - bounce);
      ctx.quadraticCurveTo(-.84, -3.1 - bounce, -.72, -2.18 - bounce);
      ctx.quadraticCurveTo(-.74, -1.76, -.49, -1.39);
      ctx.quadraticCurveTo(-.27, -1.53, -.18, -1.78);
      ctx.lineTo(.33, -1.78);
      ctx.quadraticCurveTo(.47, -1.47, .66, -1.39);
      ctx.quadraticCurveTo(.88, -1.88, .7, -2.42 - bounce);
      ctx.quadraticCurveTo(.72, -2.98 - bounce, .35, -3.05 - bounce);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 220, 196, .36)";
      ctx.lineWidth = .035;
      ctx.beginPath();
      ctx.moveTo(-.57, -2.48 - bounce);
      ctx.quadraticCurveTo(-.68, -1.9, -.48, -1.55);
      ctx.moveTo(.53, -2.48 - bounce);
      ctx.quadraticCurveTo(.78, -1.94, .64, -1.53);
      ctx.stroke();
    }

    const armSwing = stride * .2;
    drawLimb(-.39, -1.42 - bounce, -.52 - armSwing, -.78, .24,
      character.sleeveLight, character.sleeves, character.sleeveShade);
    drawLimb(.39, -1.42 - bounce, .52 + armSwing, -.78, .24,
      character.sleeveLight, character.sleeves, character.sleeveShade);

    const bodyGradient = ctx.createLinearGradient(-.48, -1.64, .48, -.76);
    bodyGradient.addColorStop(0, character.sleeveLight);
    bodyGradient.addColorStop(.5, character.sleeves);
    bodyGradient.addColorStop(1, character.sleeveShade);
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = outline;
    ctx.lineWidth = .065;
    ctx.beginPath();
    ctx.moveTo(-.39, -1.47 - bounce);
    ctx.quadraticCurveTo(-.43, -1.68 - bounce, -.23, -1.69 - bounce);
    ctx.lineTo(.23, -1.69 - bounce);
    ctx.quadraticCurveTo(.43, -1.65 - bounce, .39, -1.43 - bounce);
    ctx.lineTo(.3, -.83 - bounce);
    ctx.quadraticCurveTo(0, -.69 - bounce, -.3, -.83 - bounce);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 247, 226, .58)";
    ctx.lineWidth = .035;
    ctx.beginPath();
    ctx.moveTo(-.24, -1.52 - bounce);
    ctx.quadraticCurveTo(-.14, -1.19 - bounce, -.2, -.91 - bounce);
    ctx.stroke();

    const headGradient = ctx.createLinearGradient(-.55, -2.95, .58, -1.52);
    headGradient.addColorStop(0, character.skinLight);
    headGradient.addColorStop(.58, character.skin);
    headGradient.addColorStop(1, character.skinShade);
    ctx.fillStyle = headGradient;
    ctx.strokeStyle = outline;
    ctx.lineWidth = .065;
    ctx.beginPath();
    ctx.ellipse(0, faceY, .61, .67, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const eyeWhite = ctx.createRadialGradient(-.03, faceY + .04, .015, 0, faceY + .08, .22);
    eyeWhite.addColorStop(0, "#fff9ec");
    eyeWhite.addColorStop(1, "#e8d6c6");
    ctx.fillStyle = eyeWhite;
    ctx.beginPath();
    ctx.ellipse(-.23, faceY + .08, .15, .205, -.08, 0, Math.PI * 2);
    ctx.ellipse(.23, faceY + .08, .15, .205, .08, 0, Math.PI * 2);
    ctx.fill();

    const iris = ctx.createRadialGradient(-.015, faceY + .11, .018, 0, faceY + .1, .12);
    iris.addColorStop(0, character.eyeLight);
    iris.addColorStop(.5, character.eye);
    iris.addColorStop(1, character.eyeShade);
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(-.23, faceY + .09, .105, .16, 0, 0, Math.PI * 2);
    ctx.ellipse(.23, faceY + .09, .105, .16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#30252b";
    ctx.beginPath();
    ctx.ellipse(-.23, faceY + .105, .056, .112, 0, 0, Math.PI * 2);
    ctx.ellipse(.23, faceY + .105, .056, .112, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.arc(-.265, faceY + .16, .038, 0, Math.PI * 2);
    ctx.arc(.195, faceY + .16, .038, 0, Math.PI * 2);
    ctx.arc(-.2, faceY + .055, .018, 0, Math.PI * 2);
    ctx.arc(.26, faceY + .055, .018, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = character.hairShade;
    ctx.lineWidth = .035;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-.39, faceY - .1);
    ctx.quadraticCurveTo(-.24, faceY - .24, -.1, faceY - .12);
    ctx.moveTo(.1, faceY - .12);
    ctx.quadraticCurveTo(.24, faceY - .24, .39, faceY - .1);
    ctx.stroke();

    ctx.fillStyle = "rgba(232, 123, 128, .48)";
    ctx.beginPath();
    ctx.ellipse(-.42, faceY + .28, .12, .055, -.08, 0, Math.PI * 2);
    ctx.ellipse(.42, faceY + .28, .12, .055, .08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 222, 201, .82)";
    ctx.beginPath();
    ctx.ellipse(-.42, faceY + .27, .07, .018, -.08, 0, Math.PI * 2);
    ctx.ellipse(.42, faceY + .27, .07, .018, .08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cb8170";
    ctx.beginPath();
    ctx.ellipse(0, faceY + .27, .025, .018, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#985a5d";
    ctx.lineWidth = .03;
    ctx.beginPath();
    ctx.moveTo(-.09, faceY + .36);
    ctx.quadraticCurveTo(0, faceY + .45, .1, faceY + .35);
    ctx.stroke();

    ctx.fillStyle = character.hair;
    ctx.strokeStyle = outline;
    ctx.lineWidth = .045;
    ctx.beginPath();
    ctx.moveTo(-.57, faceY + .02);
    ctx.quadraticCurveTo(-.69, faceY - .53, -.34, faceY - .67);
    ctx.quadraticCurveTo(-.06, faceY - .79, .21, faceY - .68);
    ctx.quadraticCurveTo(.66, faceY - .54, .57, faceY - .03);
    if (character.longHair) {
      ctx.quadraticCurveTo(.41, faceY - .3, .19, faceY - .33);
      ctx.quadraticCurveTo(-.02, faceY - .19, -.19, faceY - .31);
      ctx.quadraticCurveTo(-.4, faceY - .13, -.57, faceY + .02);
    } else {
      ctx.quadraticCurveTo(.36, faceY - .3, .19, faceY - .43);
      ctx.lineTo(.06, faceY - .3);
      ctx.quadraticCurveTo(-.12, faceY - .4, -.27, faceY - .28);
      ctx.quadraticCurveTo(-.4, faceY - .16, -.57, faceY + .02);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = character.hairLight;
    ctx.lineWidth = .035;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-.34, faceY - .54);
    ctx.quadraticCurveTo(-.13, faceY - .71, .12, faceY - .66);
    ctx.moveTo(-.4, faceY - .45);
    ctx.quadraticCurveTo(-.51, faceY - .2, -.47, faceY + .03);
    if (character.longHair) {
      ctx.moveTo(.43, faceY - .46);
      ctx.quadraticCurveTo(.55, faceY - .15, .48, faceY + .2);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 238, 216, .78)";
    ctx.lineWidth = .025;
    ctx.beginPath();
    ctx.ellipse(0, faceY, .59, .65, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawWalkers(cameraZ, cameraX, focal, horizon, cameraHeight, time) {
    const firstZ = cameraZ + 8;
    const secondZ = firstZ + .55;
    const walkers = [
      {
        z: firstZ,
        x: pathCenter(firstZ) - .82,
        character: {
          hair: "#332a2b",
          hairLight: "#73504a",
          hairShade: "#211f23",
          longHair: false,
          skin: "#e5aa84",
          skinLight: "#ffcfaa",
          skinShade: "#b87562",
          eye: "#79513f",
          eyeLight: "#c28b61",
          eyeShade: "#503d3c",
          sleeves: "#c75c68",
          sleeveLight: "#f0a08e",
          sleeveShade: "#963f50",
          pants: "#536c88",
          pantsLight: "#8299b1",
          pantsShade: "#354b68",
          shoes: "#f4e8d8",
          shoeShade: "#655153",
        },
        phase: 0,
      },
      {
        z: secondZ,
        x: pathCenter(secondZ) - .02,
        character: {
          hair: "#29252a",
          hairLight: "#65504d",
          hairShade: "#17191e",
          longHair: true,
          skin: "#e9b08c",
          skinLight: "#ffd2ae",
          skinShade: "#bd7966",
          eye: "#65473b",
          eyeLight: "#bd8963",
          eyeShade: "#49383a",
          sleeves: "#f3eee6",
          sleeveLight: "#fffaf1",
          sleeveShade: "#c6c1bd",
          pants: "#607a98",
          pantsLight: "#94abc2",
          pantsShade: "#3d5574",
          shoes: "#f6eee3",
          shoeShade: "#74646a",
        },
        phase: Math.PI,
      },
    ];

    for (const walker of walkers) {
      const point = project(walker.x, walker.z, cameraZ, cameraX, focal, horizon, cameraHeight);
      if (point) drawChibi(point, time, walker.character, walker.phase);
    }
  }

  function drawRoseArches(cameraZ, cameraX, focal, horizon, cameraHeight, time) {
    const firstArch = Math.ceil((cameraZ + 23) / 25) * 25;
    for (let archZ = firstArch + 100; archZ >= firstArch; archZ -= 25) {
      ctx.beginPath();
      let started = false;
      const points = [];
      for (let i = 0; i <= 32; i++) {
        const t = -1 + i / 16;
        const elevation = 3.15 * Math.sqrt(Math.max(0, 1 - t * t));
        const worldX = pathCenter(archZ) + t * 4.1;
        const point = project(worldX, archZ, cameraZ, cameraX, focal, horizon, cameraHeight);
        if (!point) continue;
        point.y -= elevation * point.scale;
        points.push(point);
      }
      if (points.length < 2) continue;

      const thickness = Math.min(7, Math.max(1.2, points[0].scale * .17));
      ctx.strokeStyle = "rgba(61, 58, 46, .88)";
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      for (let i = 2; i < points.length - 2; i += 3) {
        const point = points[i];
        const size = Math.min(8, Math.max(1.2, point.scale * .18));
        const pulse = .85 + Math.sin(time * .001 + i + archZ) * .15;
        ctx.fillStyle = i % 2 ? "#d8818f" : "#f1b3ac";
        ctx.beginPath();
        ctx.arc(point.x, point.y, size * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,226,194,.82)";
        ctx.beginPath();
        ctx.arc(point.x - size * .18, point.y - size * .2, size * .28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.lineCap = "butt";
  }

  function drawDriftingPetals(time) {
    for (const petal of petals) {
      const cycle = (petal.y + time * .000035 * petal.speed * 100) % 1;
      const x = ((petal.x + Math.sin(time * .00035 + petal.phase) * petal.drift + 1) % 1) * width;
      const y = cycle * height;
      const rotation = Math.sin(time * .001 + petal.phase) * .9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = `rgba(255, ${168 + Math.round(petal.x * 38)}, ${177 + Math.round(petal.y * 30)}, ${.28 + cycle * .42})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size * 1.35, petal.size * .62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function render(time) {
    const delta = Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    currentProgress += (scrollProgress - currentProgress) * Math.min(1, delta * 6);
    pointerX += (pointerTarget - pointerX) * .045;

    const horizon = height * .34;
    const focal = height * .92;
    const cameraZ = 5 + currentProgress * 125;
    const cameraX = pathCenter(cameraZ) + pointerX * .6;
    const cameraHeight = 1.65;

    drawSky(currentProgress, horizon);
    const ground = ctx.createLinearGradient(0, horizon, 0, height);
    ground.addColorStop(0, "#58674c");
    ground.addColorStop(.42, "#354e3c");
    ground.addColorStop(1, "#282b36");
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, width, height - horizon);

    const pond = getPondProjection(cameraZ, cameraX, focal, horizon, cameraHeight);
    drawGroundTexture(cameraZ, cameraX, focal, horizon, cameraHeight, pond);
    drawRoseArches(cameraZ, cameraX, focal, horizon, cameraHeight, time);
    drawPond(pond);
    drawPath(cameraZ, cameraX, focal, horizon, cameraHeight);
    drawPathTexture(cameraZ, cameraX, focal, horizon, cameraHeight);
    foliageContext.clearRect(0, 0, width, height);
    ctx = foliageContext;
    for (const plant of plants) {
      drawPlant(plant, cameraZ, cameraX, focal, horizon, cameraHeight, time, pond);
    }
    drawRoadsidePhotos(cameraZ, cameraX, focal, horizon, cameraHeight, time);
    ctx = sceneContext;
    drawDriftingPetals(time);

    requestAnimationFrame(render);
  }

  window.addEventListener("resize", () => {
    resize();
  });
  window.addEventListener("scroll", updateScroll, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointerTarget = (event.clientX / Math.max(1, width) - .5) * 2;
  }, { passive: true });
  openLetterButton.addEventListener("click", () => {
    envelopeView.hidden = true;
    loveLetter.hidden = false;
    openLetterButton.setAttribute("aria-expanded", "true");
    finishLetterButton.focus();
  });
  finishLetterButton.addEventListener("click", finishReading);
  for (const eventName of ["wheel", "touchstart"]) {
    window.addEventListener(eventName, stopPresentation, { passive: true });
  }
  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
      stopPresentation();
    }
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  savedScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", () => {
    window.scrollTo(0, 0);
    updateScroll();
  }, { once: true });
  document.documentElement.classList.add("letter-locked");
  resize();
  updateScroll();
  requestAnimationFrame(render);
})();

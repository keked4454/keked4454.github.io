import { CONTENT, VARIANT } from './content.js';

// Static HTML is the no-JavaScript snapshot; content.js owns all authored copy.
for (const element of document.querySelectorAll('[data-copy]')) {
  element.innerHTML = CONTENT[element.dataset.copy];
}
document.title = CONTENT.title;
const host = document.querySelector('#hero-experience');
const plainNav = host.querySelector('nav');
plainNav.setAttribute('aria-label', CONTENT.viewLabel);
plainNav.replaceChildren(...CONTENT.presets.map(preset => {
  const link = document.createElement('a');
  link.href = preset.href;
  link.textContent = preset.label;
  return link;
}));

if (VARIANT !== 'b') setupModel();

function setupModel() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const media = document.createElement('div');
  media.className = 'media';
  const poster = document.createElement('img');
  poster.src = 'assets/personal-poster.jpg';
  poster.alt = CONTENT.posterAlt;
  poster.width = 600;
  poster.height = 600;
  media.append(poster);
  const controls = document.createElement('div');
  controls.className = 'presets';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', CONTENT.viewLabel);
  const caption = document.createElement('p');
  caption.className = 'view-caption';
  caption.id = 'view-caption';
  caption.setAttribute('aria-live', 'polite');
  caption.setAttribute('aria-atomic', 'true');
  caption.textContent = CONTENT.presets[0].caption;
  let viewer, video, selected = 0, frame, timeout, stopped = false, failed = false;
  let captionAnimation;
  const buttons = CONTENT.presets.map((preset, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = preset.label;
    button.setAttribute('aria-pressed', String(index === 0));
    button.setAttribute('aria-controls', caption.id);
    button.addEventListener('click', () => {
      selected = index;
      stopRotation();
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
      caption.textContent = preset.caption;
      captionAnimation?.cancel();
      if (!reduced.matches) captionAnimation = caption.animate(
        [{ transform: 'translateX(12px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
        { duration: 220, easing: 'ease-out' }
      );
      moveCamera(preset);
    });
    return button;
  });
  controls.append(...buttons);
  host.replaceChildren(media, controls, caption);

  function stopRotation() {
    stopped = true;
    viewer?.removeAttribute('auto-rotate');
  }
  // Once a visitor engages, keep the object still until they rotate it themselves.
  host.addEventListener('pointerenter', stopRotation);
  host.addEventListener('focusin', stopRotation);
  host.addEventListener('touchstart', stopRotation, { passive: true });
  media.addEventListener('touchmove', event => {
    if (viewer && !failed) event.preventDefault();
  }, { passive: false });
  function moveCamera(preset) {
    cancelAnimationFrame(frame);
    if (!viewer?.loaded || failed) return;
    const orbit = viewer.getCameraOrbit();
    const start = [orbit.theta * 180 / Math.PI, orbit.phi * 180 / Math.PI];
    const delta = ((preset.orbit[0] - start[0] + 540) % 360 + 360) % 360 - 180;
    const target = viewer.getCameraTarget();
    const center = viewer.getBoundingBoxCenter();
    const apply = t => {
      viewer.setAttribute('camera-orbit', `${start[0] + delta * t}deg ${start[1] + (preset.orbit[1] - start[1]) * t}deg ${orbit.radius}m`);
      viewer.setAttribute('camera-target', `${target.x + (center.x - target.x) * t}m ${target.y + (center.y - target.y) * t}m ${target.z + (center.z - target.z) * t}m`);
    };
    if (reduced.matches) {
      apply(1);
      viewer.jumpCameraToGoal();
      return;
    }
    const startTime = performance.now();
    function animate(now) {
      const t = Math.min((now - startTime) / 600, 1);
      apply(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
  }
  function videoFallback() {
    if (failed) return;
    failed = true;
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    viewer?.remove();
    poster.hidden = false;
    // Reduced motion keeps the static poster instead of autoplaying a loop.
    if (reduced.matches) return;
    video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.poster = poster.src;
    video.setAttribute('aria-label', CONTENT.posterAlt);
    const restorePoster = () => { video.remove(); poster.hidden = false; };
    video.addEventListener('playing', () => { if (!reduced.matches && !video.hidden) poster.hidden = true; });
    video.addEventListener('error', restorePoster, { once: true });
    video.src = 'assets/personal-loop.webm';
    media.append(video);
    video.play().catch(() => { video.remove(); poster.hidden = false; });
  }
  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    captionAnimation?.cancel();
    if (reduced.matches) {
      viewer?.removeAttribute('auto-rotate');
      video?.pause();
      if (video) { video.hidden = true; poster.hidden = false; }
      moveCamera(CONTENT.presets[selected]);
    } else if (video?.isConnected) {
      video.hidden = false;
      video.play().catch(() => { video.remove(); poster.hidden = false; });
    } else if (viewer && !stopped) viewer.setAttribute('auto-rotate', '');
  });
  async function loadModel() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return videoFallback();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    timeout = setTimeout(videoFallback, 60000);
    try {
      const dracoDecoderLocation = new URL('./assets/draco/', import.meta.url).href;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/model-viewer.min.js';
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', reject, { once: true });
        document.head.append(script);
      });
      customElements.get('model-viewer').dracoDecoderLocation = dracoDecoderLocation;
      if (failed) return;
      viewer = document.createElement('model-viewer');
      viewer.setAttribute('alt', CONTENT.modelAlt);
      viewer.setAttribute('camera-controls', '');
      viewer.setAttribute('touch-action', 'none');
      viewer.setAttribute('interaction-prompt', 'none');
      viewer.setAttribute('loading', 'lazy');
      viewer.setAttribute('camera-orbit', `${CONTENT.presets[selected].orbit[0]}deg 75deg 125%`);
      viewer.setAttribute('rotation-per-second', '5deg');
      viewer.setAttribute('auto-rotate-delay', '3000');
      viewer.setAttribute('interpolation-decay', '20');
      viewer.setAttribute('shadow-intensity', '0');
      // Keep a single image visible while the transparent WebGL canvas loads.
      viewer.style.visibility = 'hidden';
      if (!reduced.matches && !stopped) viewer.setAttribute('auto-rotate', '');
      viewer.addEventListener('load', () => {
        clearTimeout(timeout);
        poster.hidden = true;
        viewer.style.visibility = 'visible';
        moveCamera(CONTENT.presets[selected]);
      }, { once: true });
      viewer.addEventListener('error', videoFallback);
      viewer.src = 'assets/personal-model.glb';
      media.append(viewer);
    } catch { videoFallback(); }
  }
  // Fetch the heavy runtime/model only after text paints and the hero is near view.
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(loadModel));
    }
  }, { rootMargin: '100px' });
  observer.observe(media);
}

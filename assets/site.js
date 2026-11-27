const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#menu');

if (menuToggle && nav) {
  nav.closest('.masthead').dataset.navReady = '';
  const inspections = nav.querySelector('.nav-inspections');
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    if (inspections) inspections.open = false;
  };

  document.addEventListener('click', (event) => {
    if (inspections?.open && !inspections.contains(event.target)) inspections.open = false;
  });

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else menuToggle.setAttribute('aria-expanded', 'true');
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (inspections?.open && inspections.contains(document.activeElement)) {
      inspections.open = false;
      inspections.querySelector('summary').focus();
      return;
    }
    if (menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('.film-toggle').forEach((control) => {
  const video = document.getElementById(control.getAttribute('aria-controls'));
  if (!video) return;

  const label = control.querySelector('span');
  const canObserve = 'IntersectionObserver' in window;
  let isVisible = !canObserve;
  let wantsPlayback = video.hasAttribute('data-autoplay') && !prefersLessMotion.matches && !navigator.connection?.saveData;

  const updateControl = () => {
    label.textContent = video.paused ? 'Reproducir video' : 'Pausar video';
    control.classList.toggle('is-paused', video.paused);
    video.classList.toggle('is-playing', !video.paused);
  };

  const syncPlayback = () => {
    if (!isVisible || !wantsPlayback) {
      video.pause();
      return;
    }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(updateControl);
  };

  control.hidden = false;
  updateControl();
  video.addEventListener('playing', updateControl);
  video.addEventListener('pause', updateControl);
  control.addEventListener('click', () => {
    wantsPlayback = video.paused;
    syncPlayback();
  });

  if (canObserve) {
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.2 });
    observer.observe(video);
  } else {
    syncPlayback();
  }

  prefersLessMotion.addEventListener('change', () => {
    if (prefersLessMotion.matches) {
      wantsPlayback = false;
      syncPlayback();
    }
  });
});

const marqueeToggle = document.querySelector('.marquee-toggle');
if (marqueeToggle) {
  const updateMarquees = (running) => {
    document.body.classList.toggle('marquees-running', running);
    marqueeToggle.setAttribute('aria-label', running ? 'Pausar cintas en movimiento' : 'Reanudar cintas en movimiento');
  };

  const syncMotionPreference = () => {
    marqueeToggle.hidden = prefersLessMotion.matches;
    document.body.classList.toggle('marquees-ready', !prefersLessMotion.matches);
    updateMarquees(!prefersLessMotion.matches);
  };

  marqueeToggle.addEventListener('click', () => updateMarquees(!document.body.classList.contains('marquees-running')));
  prefersLessMotion.addEventListener('change', syncMotionPreference);
  syncMotionPreference();
}

const trace = document.querySelector('#trace');
if (trace) {
  const context = trace.getContext('2d');
  const baseline = 164;
  const echoes = [[75, 111, 9], [279, 38, 13], [370, 78, 16], [490, 19, 16], [625, 47, 14], [738, 24, 13]];
  context.strokeStyle = 'rgba(174, 194, 182, .15)';
  context.beginPath();
  for (let x = 0; x <= trace.width; x += 44) {
    context.moveTo(x, 0);
    context.lineTo(x, trace.height);
  }
  for (let y = 0; y < trace.height; y += 30) {
    context.moveTo(0, y);
    context.lineTo(trace.width, y);
  }
  context.stroke();

  context.strokeStyle = '#ffbd72';
  context.lineWidth = 2.5;
  context.beginPath();
  for (let x = 0; x < trace.width; x++) {
    let height = 2 + Math.sin(x * 1.68) * Math.sin(x * 0.57) * 3.6;
    for (const [center, peak, width] of echoes) {
      const distance = (x - center) / width;
      height += peak * Math.exp(-(distance ** 2)) * Math.abs(Math.cos((x - center) * 0.29));
    }
    if (x === 0) context.moveTo(x, baseline - height);
    else context.lineTo(x, baseline - height);
  }
  context.stroke();

  const instrument = trace.closest('.instrument');
  const steps = instrument.querySelector('.trace-steps');
  const cursor = instrument.querySelector('.trace-cursor');
  const explanation = instrument.querySelector('.instrument-label');
  const readings = [
    { position: '8.5%', text: 'Emisión. El primer pico marca el envío del pulso.' },
    { position: '42%', text: 'Eco ilustrativo. La separación entre los picos representa el tiempo que tarda en volver la señal.' }
  ];

  const playTrace = () => {
    if (prefersLessMotion.matches || !trace.animate) return;
    for (const animation of trace.getAnimations()) animation.cancel();
    trace.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }],
      { duration: 1250, easing: 'ease-out' }
    );
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      playTrace();
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(trace);
  }

  steps.addEventListener('click', (event) => {
    const button = event.target.closest('[data-trace-step]');
    if (!button) return;
    const reading = readings[Number(button.dataset.traceStep)];
    for (const step of steps.querySelectorAll('button')) {
      step.setAttribute('aria-pressed', String(step === button));
    }
    cursor.hidden = false;
    cursor.style.left = reading.position;
    explanation.textContent = reading.text;
    playTrace();
  });
  steps.hidden = false;
}

if ('IntersectionObserver' in window && !prefersLessMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (entry.target.matches(':focus-within')) {
        observer.unobserve(entry.target);
        continue;
      }
      entry.target.classList.add('has-entered');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });

  document.querySelectorAll('[data-reveal], .gallery figure, .editorial-detail').forEach((element) => {
    observer.observe(element);
  });
}

const progress = document.querySelector('.reading-progress');
if (progress) {
  const sections = Array.from(document.querySelectorAll('.detail-section-nav a'), link => ({
    link,
    target: document.getElementById(link.hash.slice(1))
  })).filter(section => section.target);
  const sectionBar = document.querySelector('.detail-section-bar');
  let activeSection = null;
  let framePending = false;
  const drawProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollHeight > 0 ? Math.min(1, window.scrollY / scrollHeight) : 0;
    progress.style.transform = `scaleX(${ratio})`;

    if (sectionBar && sections.length) {
      const stickyArea = sectionBar.getBoundingClientRect().height;
      const anchorMargin = Number.parseFloat(getComputedStyle(sections[0].target).scrollMarginTop);
      const offset = Math.max(stickyArea + 12, anchorMargin + 4);
      const current = sections.findLast(section => section.target.getBoundingClientRect().top <= offset);
      if (current?.link !== activeSection) {
        activeSection?.removeAttribute('aria-current');
        activeSection = current?.link;
        activeSection?.setAttribute('aria-current', 'location');
      }
    }
    framePending = false;
  };

  const requestProgress = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(drawProgress);
  };
  window.addEventListener('scroll', requestProgress, { passive: true });
  window.addEventListener('resize', requestProgress);
  requestProgress();
}

const consultation = document.querySelector('#consulta');
const preview = document.querySelector('#consulta-previa');

if (consultation && preview && typeof preview.showModal === 'function') {
  const nameInput = consultation.querySelector('#nombre');
  const service = consultation.querySelector('#servicio');
  const locationInput = consultation.querySelector('#ubicacion');
  const message = consultation.querySelector('#mensaje');
  const counter = consultation.querySelector('#contador');
  const submit = consultation.querySelector('button[type="submit"]');
  const previewSend = preview.querySelector('.preview-send');

  nameInput.required = true;
  service.required = true;
  consultation.querySelectorAll('[data-enhanced]').forEach((element) => { element.hidden = false; });

  const requestedService = new URLSearchParams(window.location.search).get('servicio');
  if (requestedService && Array.from(service.options).some((option) => option.value === requestedService)) {
    service.value = requestedService;
  }

  const updateCounter = () => {
    counter.textContent = `${message.value.length} / ${message.maxLength}`;
    counter.classList.toggle('is-near-limit', message.value.length >= message.maxLength - 40);
  };

  counter.hidden = false;
  message.addEventListener('input', updateCounter);
  updateCounter();

  const wantsEmail = () => consultation.querySelector('input[name="canal"]:checked').value === 'email';
  const updateChannel = () => { submit.textContent = wantsEmail() ? 'Revisar consulta para correo' : 'Revisar consulta para WhatsApp'; };
  consultation.querySelector('.contact-channel').addEventListener('change', updateChannel);
  updateChannel();

  for (const field of [nameInput, message]) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }

  consultation.addEventListener('submit', (event) => {
    event.preventDefault();
    for (const field of [nameInput, message]) {
      if (!field.value.trim()) {
        field.setCustomValidity('Completá este campo para continuar.');
        field.reportValidity();
        return;
      }
    }
    const subject = service.selectedOptions[0].textContent;
    const lines = [
      'Hola, Jorge. Quisiera hacer una consulta técnica.',
      `Nombre: ${nameInput.value.trim()}`,
      `Inspección: ${subject}`
    ];
    if (locationInput.value.trim()) lines.push(`Ubicación: ${locationInput.value.trim()}`);
    lines.push('', message.value.trim());
    const body = lines.join('\n');
    const encodedBody = encodeURIComponent(body);
    const email = wantsEmail();

    preview.querySelector('#previa-mensaje').textContent = body;
    previewSend.textContent = email ? 'Abrir correo' : 'Abrir WhatsApp';
    previewSend.href = email
      ? `mailto:jflock@hotmail.com?subject=${encodeURIComponent('Consulta técnica · ' + subject)}&body=${encodedBody}`
      : `https://wa.me/5491157824853?text=${encodedBody}`;
    previewSend.target = email ? '_self' : '_blank';
    preview.showModal();
  });

  preview.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => preview.close()));
  previewSend.addEventListener('click', () => preview.close());
}

const gallery = document.querySelector('.gallery-grid');
if (gallery && 'HTMLDialogElement' in window && 'showModal' in HTMLDialogElement.prototype) {
  const photos = Array.from(gallery.querySelectorAll('figure a'));
  if (photos.length) {
    const viewer = document.createElement('dialog');
    viewer.className = 'gallery-viewer';
    viewer.setAttribute('aria-labelledby', 'foto-archivo');
    viewer.innerHTML = `
      <div class="dialog-top"><h3 id="foto-archivo">Archivo fotográfico</h3><button type="button" class="dialog-close" aria-label="Cerrar foto">×</button></div>
      <figure><img alt=""><figcaption aria-live="polite"></figcaption></figure>
      <div class="gallery-controls"><button type="button">Anterior</button><span></span><button type="button">Siguiente</button></div>`;
    gallery.after(viewer);

    const fullPhoto = viewer.querySelector('img');
    const caption = viewer.querySelector('figcaption');
    const controls = viewer.querySelector('.gallery-controls');
    const [previous, next] = controls.querySelectorAll('button');
    const position = controls.querySelector('span');
    let index = 0;
    let photoEntrance;

    fullPhoto.addEventListener('load', () => {
      if (!viewer.open || prefersLessMotion.matches) return;
      photoEntrance?.cancel();
      photoEntrance = fullPhoto.animate(
        [{ opacity: .65, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 240, easing: 'ease-out' }
      );
    });

    const showPhoto = (requestedIndex) => {
      index = (requestedIndex + photos.length) % photos.length;
      const photo = photos[index];
      caption.textContent = photo.closest('figure').querySelector('figcaption').textContent;
      fullPhoto.src = photo.href;
      position.textContent = `${index + 1} / ${photos.length}`;
    };

    controls.hidden = photos.length < 2;
    photos.forEach((photo, photoIndex) => {
      photo.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        showPhoto(photoIndex);
        viewer.showModal();
      });
    });
    viewer.querySelector('.dialog-close').addEventListener('click', () => viewer.close());
    previous.addEventListener('click', () => showPhoto(index - 1));
    next.addEventListener('click', () => showPhoto(index + 1));
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') showPhoto(index - 1);
      if (event.key === 'ArrowRight') showPhoto(index + 1);
    });
  }
}

document.querySelectorAll('[data-tech-panel]').forEach((panel) => {
  const graphic = panel.querySelector('[data-tech-view]');
  const options = panel.querySelector('.tech-options');
  const notes = panel.querySelectorAll('[data-tech-note]');
  const buttons = options.querySelectorAll('[data-tech-step]');
  const replay = panel.querySelector('[data-tech-replay]');

  const updateReplay = () => {
    if (replay) replay.hidden = prefersLessMotion.matches || graphic.dataset.stage === '0';
  };

  if (replay) {
    replay.addEventListener('click', () => {
      for (const animation of graphic.getAnimations({ subtree: true })) {
        animation.currentTime = 0;
        animation.play();
      }
    });
    prefersLessMotion.addEventListener('change', updateReplay);
  }

  const show = (stage) => {
    graphic.dataset.stage = stage;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.techStep === stage));
    }
    for (const note of notes) note.hidden = note.dataset.techNote !== stage;
    updateReplay();
  };

  options.addEventListener('click', (event) => {
    const selected = event.target.closest('[data-tech-step]');
    if (selected) show(selected.dataset.techStep);
  });
  show(buttons[0].dataset.techStep);
  options.hidden = false;
});

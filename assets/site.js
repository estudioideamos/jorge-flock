const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#menu');

if (menuToggle && nav) {
  const closeMenu = () => menuToggle.setAttribute('aria-expanded', 'false');

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const film = document.querySelector('#hero-film');
const filmToggle = document.querySelector('.film-toggle');

if (film && filmToggle) {
  const label = filmToggle.querySelector('span');

  const updateControl = () => {
    label.textContent = film.paused ? 'Reproducir video' : 'Pausar video';
    filmToggle.classList.toggle('is-paused', film.paused);
    film.classList.toggle('is-playing', !film.paused);
  };

  const playFilm = () => {
    if (!film.getAttribute('src')) film.src = film.dataset.src;
    film.play().catch(updateControl);
  };

  filmToggle.hidden = false;
  updateControl();
  film.addEventListener('play', updateControl);
  film.addEventListener('pause', updateControl);
  filmToggle.addEventListener('click', () => film.paused ? playFilm() : film.pause());
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
}

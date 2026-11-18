const field = document.querySelector('#playfield');
const startPanel = document.querySelector('#startPanel');
const overPanel = document.querySelector('#gameOverPanel');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const livesEl = document.querySelector('#lives');
const finalScoreEl = document.querySelector('#finalScore');

let score = 0;
let lives = 3;
let playing = false;
let spawnTimer = null;
let raf = null;
let balloons = [];
let best = Number(localStorage.getItem('balloon-best') || 0);
bestEl.textContent = best;

const colors = [
  ['#ef626b','#ff969b'], ['#5dace8','#92cafa'], ['#ffc84b','#ffe48a'],
  ['#9b75d5','#c5a4ef'], ['#53bfa1','#89dcca'], ['#f49b52','#ffc58e']
];

function startGame() {
  balloons.forEach(b => b.el.remove());
  balloons = [];
  score = 0; lives = 3; playing = true;
  scoreEl.textContent = '0'; updateLives();
  startPanel.classList.add('hidden'); overPanel.classList.add('hidden');
  clearTimeout(spawnTimer); cancelAnimationFrame(raf);
  spawnBalloon();
  spawnLoop();
  raf = requestAnimationFrame(tick);
}

function updateLives() { livesEl.textContent = lives > 0 ? '♥ '.repeat(lives).trim() : '♡'; }

function spawnLoop() {
  if (!playing) return;
  spawnBalloon();
  const delay = Math.max(430, 1050 - score * 11);
  spawnTimer = setTimeout(spawnLoop, delay);
}

function spawnBalloon() {
  if (!playing) return;
  const rect = field.getBoundingClientRect();
  const el = document.createElement('button');
  el.className = 'balloon'; el.setAttribute('aria-label','Pop balloon');
  const palette = colors[Math.floor(Math.random() * colors.length)];
  el.style.setProperty('--c', palette[0]); el.style.setProperty('--c2', palette[1]);
  const size = rect.width < 600 ? 58 : 68;
  el.style.width = size + 'px'; el.style.height = (size * 1.27) + 'px';
  const x = 18 + Math.random() * Math.max(1, rect.width - size - 36);
  el.style.left = x + 'px';
  el.style.top = rect.height + 20 + 'px';

  const data = {
    el, x, y: rect.height + 20,
    speed: (58 + Math.random() * 38) + Math.min(score * 1.1, 55),
    wobble: Math.random() * Math.PI * 2,
    popped:false
  };
  el.addEventListener('pointerdown', e => { e.preventAnimation; popBalloon(data, e); });
  field.appendChild(el);
  balloons.push(data);
}

function popBalloon(data, event) {
  if (!playing || data.popped) return;
  data.popped = true;
  data.el.classList.add('popping');
  score += 10;
  scoreEl.textContent = score;
  const rect = field.getBoundingClientRect();
  const x = event?.clientX - rect.left;
  const y = event?.clientY - rect.top;
  const pop = document.createElement('div');
  pop.className = 'score-pop'; pop.textContent = '+10';
  pop.style.left = ((x || data.x) - 15) + 'px'; pop.style.top = ((y || data.y) - 10) + 'px';
  field.appendChild(pop);
  setTimeout(() => { pop.remove(); data.el.remove(); }, 650);
  balloons = balloons.filter(b => b !== data);
}

function tick(now) {
  if (!playing) return;
  const rect = field.getBoundingClientRect();
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    if (b.popped) continue;
    b.y -= b.speed / 60;
    b.wobble += 0.025;
    const drift = Math.sin(b.wobble) * 10;
    b.el.style.transform = `translateX(${drift}px)`;
    b.el.style.top = b.y + 'px';
    if (b.y < -110) {
      b.el.remove(); balloons.splice(i, 1);
      lives -= 1; updateLives();
      if (lives <= 0) endGame();
    }
  }
  raf = requestAnimationFrame(tick);
}

function endGame() {
  playing = false;
  clearTimeout(spawnTimer); cancelAnimationFrame(raf);
  balloons.forEach(b => b.el.remove()); balloons = [];
  if (score > best) { best = score; localStorage.setItem('balloon-best', String(best)); bestEl.textContent = best; }
  finalScoreEl.textContent = score;
  setTimeout(() => overPanel.classList.remove('hidden'), 250);
}

document.querySelector('#startButton').addEventListener('click', startGame);
document.querySelector('#restartButton').addEventListener('click', startGame);
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); if (!playing) startGame(); }
});

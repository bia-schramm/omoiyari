window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const guideCanvas = document.getElementById('guideCanvas');
  const gCtx = guideCanvas.getContext('2d');

  // Elementos do HUD e Menus
  const hudName = document.getElementById('hudName');
  const hudTimer = document.getElementById('hudTimer');
  const hudScore = document.getElementById('hudScore');
  const hudRecord = document.getElementById('hudRecord');
  const overlay = document.getElementById('screenOverlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayDesc = document.getElementById('overlayDesc');
  const btnAction = document.getElementById('btnAction');

  const tabButtons = document.querySelectorAll('.tab-btn');
  const charOptionsContainer = document.getElementById('characterOptions');
  const guideTitle = document.getElementById('guideTitle');
  const guideTextContainer = document.getElementById('guideTextContainer');

  // Grupos de Controles Mobile
  const runnerControls = document.getElementById('runnerControls');
  const singleActionControls = document.getElementById('singleActionControls');
  const lrControls = document.getElementById('lrControls');
  const riverControls = document.getElementById('riverControls');
  const bowlingControls = document.getElementById('bowlingControls');

  // Botões de Ação
  const btnJump = document.getElementById('btnJump');
  const btnDuck = document.getElementById('btnDuck');
  const btnSingleAction = document.getElementById('btnSingleAction');
  const btnMoveLeft = document.getElementById('btnMoveLeft');
  const btnMoveRight = document.getElementById('btnMoveRight');

  const btnRivUp = document.getElementById('btnRivUp');
  const btnRivDown = document.getElementById('btnRivDown');
  const btnRivLeft = document.getElementById('btnRivLeft');
  const btnRivRight = document.getElementById('btnRivRight');
  const btnRiverShoot = document.getElementById('btnRiverShoot');

  const btnBowlLeft = document.getElementById('btnBowlLeft');
  const btnBowlRight = document.getElementById('btnBowlRight');
  const btnBowlThrow = document.getElementById('btnBowlThrow');

  let currentGame = 'runner';
  let gameState = 'START';
  let score = 0;
  let particles = [];

  // Temporizador Global de 60 segundos
  let gameTimeLeft = 60;
  let lastSecondTimestamp = performance.now();

  // Histórico de Recordes Salvos
  const hiScores = {
    runner: parseInt(localStorage.getItem('pixel_record_runner') || '0', 10),
    flappy: parseInt(localStorage.getItem('pixel_record_flappy') || '0', 10),
    breakout: parseInt(localStorage.getItem('pixel_record_breakout') || '0', 10),
    river: parseInt(localStorage.getItem('pixel_record_river') || '0', 10),
    bowling: parseInt(localStorage.getItem('pixel_record_bowling') || '0', 10)
  };

  let lastFrameTime = performance.now();
  const fpsInterval = 1000 / 60;

  // Banco de Dados de Personagens e Alimentos
  const charactersData = {
    runner: [
      { id: 'capivara', name: 'Capivara', badge: '#8d6e63', foodName: 'Melancia (+30 PTS)', foodType: 'watermelon' },
      { id: 'coelho',   name: 'Coelho',   badge: '#f5f6fa', foodName: 'Cenoura (+30 PTS)', foodType: 'carrot' },
      { id: 'pato',     name: 'Pato',     badge: '#fbc531', foodName: 'Milho (+30 PTS)', foodType: 'corn' },
      { id: 'sapo',     name: 'Sapo',     badge: '#44bd32', foodName: 'Libélula (+30 PTS)', foodType: 'bug' }
    ],
    flappy: [
      { id: 'bird_blue', name: 'Passarinho Azul', badge: '#48dbfb', type: 'bird' },
      { id: 'bat_night', name: 'Morcego Noturno', badge: '#576574', type: 'bat' },
      { id: 'ufo_green', name: 'Nave Alien',     badge: '#1dd1a1', type: 'ufo' }
    ],
    breakout: [
      { id: 'pad_neon',    name: 'Raquete Neon',    badge: '#00d2d3', color: '#00d2d3', secondary: '#ff6b81' },
      { id: 'pad_crystal', name: 'Raquete Cristal', badge: '#a55eea', color: '#a55eea', secondary: '#48dbfb' },
      { id: 'pad_amber',   name: 'Raquete Âmbar',   badge: '#ff9f43', color: '#ff9f43', secondary: '#feca57' }
    ],
    river: [
      { id: 'jet',   name: 'Jato Relâmpago', badge: '#feca57', color: '#feca57', secondary: '#eb4d4b', type: 'jet' },
      { id: 'boat',  name: 'Lancha Torpedo', badge: '#54a0ff', color: '#54a0ff', secondary: '#00d2d3', type: 'boat' },
      { id: 'heli',  name: 'Helicóptero',    badge: '#2ed573', color: '#2ed573', secondary: '#1e272e', type: 'heli' }
    ],
    bowling: [
      { id: 'ball_ruby',    name: 'Bola Rubi',      badge: '#ff4757', color: '#ff4757', ring: '#ffa502' },
      { id: 'ball_obsidian',name: 'Bola Obsidiana', badge: '#2f3542', color: '#2f3542', ring: '#747d8c' },
      { id: 'ball_cosmic',  name: 'Bola Cósmica',   badge: '#9b51e0', color: '#9b51e0', ring: '#00d2d3' }
    ]
  };

  const selectedCharacter = {
    runner: 0,
    flappy: 0,
    breakout: 0,
    river: 0,
    bowling: 0
  };

  function playSfx(type) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(340, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(680, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'coin') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(70, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(700, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'strike') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.setValueAtTime(550, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(750, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {}
  }

  function spawnParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        color: color,
        size: 3 + Math.floor(Math.random() * 2),
        life: 1.0
      });
    }
  }

  function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.035;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1.0;
    }
  }

  function drawPixelFood(targetCtx, x, y, foodType) {
    const s = 2;
    targetCtx.save();
    targetCtx.translate(x, y);

    if (foodType === 'watermelon') {
      targetCtx.fillStyle = '#2ed573';
      targetCtx.fillRect(0, 8 * s, 10 * s, 2 * s);
      targetCtx.fillStyle = '#ff4757';
      targetCtx.fillRect(1 * s, 2 * s, 8 * s, 6 * s);
      targetCtx.fillStyle = '#1e272e';
      targetCtx.fillRect(3 * s, 4 * s, 1 * s, 2 * s);
      targetCtx.fillRect(6 * s, 5 * s, 1 * s, 2 * s);
    } else if (foodType === 'carrot') {
      targetCtx.fillStyle = '#ffa502';
      targetCtx.fillRect(2 * s, 4 * s, 6 * s, 6 * s);
      targetCtx.fillRect(4 * s, 10 * s, 2 * s, 3 * s);
      targetCtx.fillStyle = '#2ed573';
      targetCtx.fillRect(3 * s, 1 * s, 4 * s, 3 * s);
    } else if (foodType === 'corn') {
      targetCtx.fillStyle = '#feca57';
      targetCtx.fillRect(3 * s, 2 * s, 4 * s, 8 * s);
      targetCtx.fillStyle = '#2ed573';
      targetCtx.fillRect(1 * s, 5 * s, 2 * s, 6 * s);
      targetCtx.fillRect(7 * s, 5 * s, 2 * s, 6 * s);
    } else if (foodType === 'bug') {
      targetCtx.fillStyle = '#70a1ff';
      targetCtx.fillRect(1 * s, 2 * s, 8 * s, 2 * s);
      targetCtx.fillStyle = '#3742fa';
      targetCtx.fillRect(4 * s, 3 * s, 2 * s, 7 * s);
    }
    targetCtx.restore();
  }

  function drawRunnerAnimal(targetCtx, x, y, type, grounded, isDucking) {
    const s = 2;
    targetCtx.save();
    targetCtx.translate(x, y);
    const step = Math.floor(Date.now() / 100) % 2 === 0;

    if (type === 'capivara') {
      targetCtx.fillStyle = '#8d6e63';
      if (isDucking) {
        targetCtx.fillRect(0, 8 * s, 18 * s, 6 * s);
        targetCtx.fillRect(14 * s, 7 * s, 5 * s, 5 * s);
        targetCtx.fillStyle = '#5d4037';
        targetCtx.fillRect(17 * s, 9 * s, 2 * s, 2 * s);
        targetCtx.fillStyle = '#1e272e';
        targetCtx.fillRect(15 * s, 8 * s, 2 * s, 1 * s);
      } else {
        targetCtx.fillRect(2 * s, 4 * s, 14 * s, 10 * s);
        targetCtx.fillRect(10 * s, 3 * s, 7 * s, 8 * s);
        targetCtx.fillStyle = '#5d4037';
        targetCtx.fillRect(14 * s, 7 * s, 3 * s, 3 * s);
        targetCtx.fillRect(8 * s, 2 * s, 2 * s, 2 * s);
        targetCtx.fillStyle = '#1e272e';
        targetCtx.fillRect(12 * s, 4 * s, 2 * s, 2 * s);
        targetCtx.fillStyle = '#4e342e';
        if (grounded) {
          targetCtx.fillRect(4 * s, 14 * s, 3 * s, step ? 3 * s : 2 * s);
          targetCtx.fillRect(12 * s, 14 * s, 3 * s, step ? 2 * s : 3 * s);
        } else {
          targetCtx.fillRect(3 * s, 13 * s, 3 * s, 3 * s);
          targetCtx.fillRect(13 * s, 13 * s, 3 * s, 3 * s);
        }
      }
    } else if (type === 'coelho') {
      targetCtx.fillStyle = '#ffffff';
      if (isDucking) {
        targetCtx.fillRect(2 * s, 8 * s, 14 * s, 6 * s);
        targetCtx.fillRect(4 * s, 5 * s, 6 * s, 3 * s);
        targetCtx.fillStyle = '#eb4d4b';
        targetCtx.fillRect(13 * s, 9 * s, 2 * s, 2 * s);
      } else {
        targetCtx.fillRect(3 * s, 5 * s, 11 * s, 9 * s);
        targetCtx.fillRect(5 * s, 0, 2 * s, 5 * s);
        targetCtx.fillRect(9 * s, 0, 2 * s, 5 * s);
        targetCtx.fillStyle = '#ffb8b8';
        targetCtx.fillRect(5 * s, 1 * s, 1 * s, 3 * s);
        targetCtx.fillRect(9 * s, 1 * s, 1 * s, 3 * s);
        targetCtx.fillStyle = '#eb4d4b';
        targetCtx.fillRect(11 * s, 7 * s, 2 * s, 2 * s);
        targetCtx.fillStyle = '#dcdde1';
        targetCtx.fillRect(4 * s, 14 * s, 3 * s, grounded ? 2 * s : 3 * s);
        targetCtx.fillRect(10 * s, 14 * s, 3 * s, grounded ? 2 * s : 3 * s);
      }
    } else if (type === 'pato') {
      targetCtx.fillStyle = '#fbc531';
      if (isDucking) {
        targetCtx.fillRect(2 * s, 9 * s, 12 * s, 5 * s);
        targetCtx.fillStyle = '#e67e22';
        targetCtx.fillRect(14 * s, 10 * s, 4 * s, 3 * s);
        targetCtx.fillStyle = '#1e272e';
        targetCtx.fillRect(11 * s, 10 * s, 2 * s, 2 * s);
      } else {
        targetCtx.fillRect(2 * s, 5 * s, 11 * s, 8 * s);
        targetCtx.fillRect(7 * s, 1 * s, 6 * s, 6 * s);
        targetCtx.fillStyle = '#e67e22';
        targetCtx.fillRect(13 * s, 4 * s, 4 * s, 3 * s);
        targetCtx.fillStyle = '#e1b12c';
        targetCtx.fillRect(4 * s, 7 * s, 5 * s, 4 * s);
        targetCtx.fillStyle = '#1e272e';
        targetCtx.fillRect(10 * s, 2 * s, 2 * s, 2 * s);
        targetCtx.fillStyle = '#e67e22';
        targetCtx.fillRect(5 * s, 13 * s, 3 * s, grounded ? 2 * s : 3 * s);
        targetCtx.fillRect(9 * s, 13 * s, 3 * s, grounded ? 2 * s : 3 * s);
      }
    } else if (type === 'sapo') {
      targetCtx.fillStyle = '#44bd32';
      if (isDucking) {
        targetCtx.fillRect(1 * s, 9 * s, 14 * s, 5 * s);
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fillRect(10 * s, 7 * s, 3 * s, 2 * s);
        targetCtx.fillStyle = '#1e272e';
        targetCtx.fillRect(11 * s, 7 * s, 1 * s, 2 * s);
      } else {
        targetCtx.fillRect(2 * s, 6 * s, 12 * s, 8 * s);
        targetCtx.fillRect(4 * s, 2 * s, 3 * s, 4 * s);
        targetCtx.fillRect(10 * s, 2 * s, 3 * s, 4 * s);
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fillRect(5 * s, 3 * s, 2 * s, 2 * s);
        targetCtx.fillRect(11 * s, 3 * s, 2 * s, 2 * s);
        targetCtx.fillStyle = '#1e272e';
        targetCtx.fillRect(6 * s, 4 * s, 1 * s, 1 * s);
        targetCtx.fillRect(12 * s, 4 * s, 1 * s, 1 * s);
        targetCtx.fillStyle = '#329c22';
        targetCtx.fillRect(1 * s, 11 * s, 3 * s, 3 * s);
        targetCtx.fillRect(12 * s, 11 * s, 3 * s, 3 * s);
      }
    }
    targetCtx.restore();
  }

  function drawFlappyCharacter(targetCtx, x, y, type) {
    const s = 2;
    targetCtx.save();
    targetCtx.translate(x, y);
    const flap = Math.sin(Date.now() / 80) > 0;

    if (type === 'bird') {
      targetCtx.fillStyle = '#48dbfb';
      targetCtx.fillRect(2 * s, 3 * s, 10 * s, 8 * s);
      targetCtx.fillRect(6 * s, 1 * s, 6 * s, 4 * s);
      targetCtx.fillStyle = '#0abde3';
      targetCtx.fillRect(flap ? 2 * s : 3 * s, flap ? 1 * s : 5 * s, 5 * s, 4 * s);
      targetCtx.fillStyle = '#ffffff';
      targetCtx.fillRect(9 * s, 2 * s, 3 * s, 3 * s);
      targetCtx.fillStyle = '#1e272e';
      targetCtx.fillRect(10 * s, 3 * s, 2 * s, 2 * s);
      targetCtx.fillStyle = '#feca57';
      targetCtx.fillRect(12 * s, 4 * s, 3 * s, 3 * s);
    } else if (type === 'bat') {
      targetCtx.fillStyle = '#2f3542';
      targetCtx.fillRect(5 * s, 3 * s, 6 * s, 7 * s);
      targetCtx.fillRect(5 * s, 0, 2 * s, 3 * s);
      targetCtx.fillRect(9 * s, 0, 2 * s, 3 * s);
      targetCtx.fillStyle = '#ff4757';
      targetCtx.fillRect(6 * s, 4 * s, 2 * s, 2 * s);
      targetCtx.fillRect(9 * s, 4 * s, 2 * s, 2 * s);
      targetCtx.fillStyle = '#1e272e';
      if (flap) {
        targetCtx.fillRect(1 * s, 1 * s, 4 * s, 3 * s);
        targetCtx.fillRect(11 * s, 1 * s, 4 * s, 3 * s);
      } else {
        targetCtx.fillRect(1 * s, 5 * s, 4 * s, 4 * s);
        targetCtx.fillRect(11 * s, 5 * s, 4 * s, 4 * s);
      }
    } else if (type === 'ufo') {
      targetCtx.fillStyle = '#70a1ff';
      targetCtx.fillRect(5 * s, 1 * s, 6 * s, 4 * s);
      targetCtx.fillStyle = '#2ed573';
      targetCtx.fillRect(7 * s, 2 * s, 2 * s, 3 * s);
      targetCtx.fillStyle = '#a4b0be';
      targetCtx.fillRect(2 * s, 5 * s, 12 * s, 3 * s);
      targetCtx.fillRect(0, 6 * s, 16 * s, 2 * s);
    }
    targetCtx.restore();
  }

  // 1. SALTO ANIMAL
  const runner = {
    floorY: 250,
    gravity: 0.58,
    speed: 4.6,
    timer: 0,
    animal: { x: 55, y: 216, w: 34, h: 34, vy: 0, grounded: true, isDucking: false },
    obstacles: [],
    clouds: [
      { x: 50, y: 40, w: 50, h: 18 },
      { x: 260, y: 70, w: 64, h: 22 },
      { x: 480, y: 45, w: 42, h: 16 }
    ],

    init() {
      this.speed = 4.6;
      this.timer = 0;
      this.obstacles = [];
      this.animal.y = this.floorY - this.animal.h;
      this.animal.vy = 0;
      this.animal.grounded = true;
      this.animal.isDucking = false;
    },

    jump() {
      if (this.animal.grounded && !this.animal.isDucking) {
        this.animal.vy = -11.4;
        this.animal.grounded = false;
        playSfx('jump');
        spawnParticles(this.animal.x + 16, this.floorY, '#ffffff', 4);
      }
    },

    setDuck(ducking) {
      if (this.animal.grounded) {
        this.animal.isDucking = ducking;
        if (ducking) {
          this.animal.h = 18;
          this.animal.y = this.floorY - 18;
        } else {
          this.animal.h = 34;
          this.animal.y = this.floorY - 34;
        }
      }
    },

    update() {
      const a = this.animal;
      a.vy += this.gravity;
      a.y += a.vy;

      if (a.y >= this.floorY - a.h) {
        a.y = this.floorY - a.h;
        a.vy = 0;
        a.grounded = true;
      }

      this.clouds.forEach(c => {
        c.x -= this.speed * 0.2;
        if (c.x + c.w < 0) c.x = canvas.width + 30;
      });

      this.timer++;
      if (this.timer > Math.max(55, 100 - Math.floor(score / 50))) {
        this.timer = 0;
        const rand = Math.random();

        if (rand < 0.3) {
          const char = charactersData.runner[selectedCharacter.runner];
          this.obstacles.push({
            x: canvas.width + 10,
            y: this.floorY - 32,
            w: 20,
            h: 20,
            type: 'FOOD',
            foodType: char.foodType
          });
        } else if (rand < 0.65) {
          this.obstacles.push({
            x: canvas.width + 10,
            y: this.floorY - 24,
            w: 22,
            h: 24,
            type: 'ROCK'
          });
        } else {
          this.obstacles.push({
            x: canvas.width + 10,
            y: this.floorY - 50,
            w: 24,
            h: 22,
            type: 'HIGH_BIRD'
          });
        }
      }

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= this.speed;

        if (
          a.x + 4 < obs.x + obs.w &&
          a.x + a.w - 4 > obs.x &&
          a.y + 4 < obs.y + obs.h &&
          a.y + a.h > obs.y
        ) {
          if (obs.type === 'FOOD') {
            score += 30;
            updateHUD();
            playSfx('coin');
            spawnParticles(obs.x + 10, obs.y + 10, '#feca57', 8);
            this.obstacles.splice(i, 1);
            continue;
          } else {
            spawnParticles(a.x + 16, a.y + 16, '#ff4757', 14);
            gameOver('COLIDIU COM O OBSTÁCULO!');
            return;
          }
        }

        if (obs.x + obs.w < 0) {
          if (obs.type !== 'FOOD') {
            score += 10;
            updateHUD();
          }
          this.obstacles.splice(i, 1);
        }
      }
    },

    draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, this.floorY);
      sky.addColorStop(0, '#6db5ff');
      sky.addColorStop(1, '#b6e3ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, this.floorY);

      ctx.fillStyle = '#ffffff';
      this.clouds.forEach(c => {
        ctx.fillRect(c.x + 8, c.y, c.w - 16, c.h);
        ctx.fillRect(c.x, c.y + 6, c.w, c.h - 6);
      });

      ctx.fillStyle = '#2ed573';
      ctx.fillRect(0, this.floorY, canvas.width, 14);
      ctx.fillStyle = '#d35400';
      ctx.fillRect(0, this.floorY + 14, canvas.width, canvas.height - this.floorY - 14);

      this.obstacles.forEach(obs => {
        if (obs.type === 'FOOD') {
          drawPixelFood(ctx, obs.x, obs.y, obs.foodType);
        } else if (obs.type === 'ROCK') {
          ctx.fillStyle = '#778ca3';
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.fillStyle = '#4b6584';
          ctx.fillRect(obs.x + 3, obs.y + 3, obs.w - 6, obs.h - 6);
        } else if (obs.type === 'HIGH_BIRD') {
          ctx.fillStyle = '#eb4d4b';
          ctx.fillRect(obs.x, obs.y + 4, obs.w, obs.h - 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x + 4, obs.y, obs.w - 8, 4);
        }
      });

      const char = charactersData.runner[selectedCharacter.runner];
      drawRunnerAnimal(ctx, this.animal.x, this.animal.y, char.id, this.animal.grounded, this.animal.isDucking);
    }
  };

  // 2. VOO PIXEL
  const flappy = {
    bird: { x: 70, y: 150, w: 32, h: 22, vy: 0 },
    gravity: 0.32,
    jumpPower: -5.8,
    pipes: [],
    timer: 0,
    speed: 2.8,

    init() {
      this.bird.y = 140;
      this.bird.vy = 0;
      this.pipes = [];
      this.timer = 0;
    },

    flap() {
      this.bird.vy = this.jumpPower;
      playSfx('jump');
      spawnParticles(this.bird.x, this.bird.y + 10, '#ffffff', 4);
    },

    update() {
      const b = this.bird;
      b.vy += this.gravity;
      b.y += b.vy;

      if (b.y < 0) b.y = 0;
      if (b.y + b.h > canvas.height) {
        gameOver('CAIU NO CHÃO!');
        return;
      }

      this.timer++;
      if (this.timer > 95) {
        this.timer = 0;
        const gap = 128;
        const topH = 30 + Math.random() * (canvas.height - gap - 60);
        this.pipes.push({
          x: canvas.width,
          w: 36,
          topH: topH,
          bottomY: topH + gap,
          passed: false
        });
      }

      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= this.speed;

        if (
          b.x + b.w > pipe.x &&
          b.x < pipe.x + pipe.w &&
          (b.y < pipe.topH || b.y + b.h > pipe.bottomY)
        ) {
          spawnParticles(b.x + 10, b.y + 10, '#ff4757', 15);
          gameOver('BATEU NO CANO!');
          return;
        }

        if (!pipe.passed && pipe.x + pipe.w < b.x) {
          pipe.passed = true;
          score += 10;
          updateHUD();
          playSfx('coin');
        }

        if (pipe.x + pipe.w < 0) this.pipes.splice(i, 1);
      }
    },

    draw() {
      ctx.fillStyle = '#48dbfb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.pipes.forEach(p => {
        ctx.fillStyle = '#10ac84';
        ctx.fillRect(p.x, 0, p.w, p.topH);
        ctx.fillRect(p.x, p.bottomY, p.w, canvas.height - p.bottomY);
        ctx.fillStyle = '#1dd1a1';
        ctx.fillRect(p.x + 3, 0, 5, p.topH);
        ctx.fillRect(p.x + 3, p.bottomY, 5, canvas.height - p.bottomY);
      });

      const char = charactersData.flappy[selectedCharacter.flappy];
      drawFlappyCharacter(ctx, this.bird.x, this.bird.y, char.type);
    }
  };

  // 3. REBATIDA
  const breakout = {
    paddle: { x: 260, y: 290, w: 80, h: 14, speed: 6.2 },
    ball: { x: 300, y: 200, r: 6, vx: 2.4, vy: -2.4 },
    bricks: [],
    moveLeft: false,
    moveRight: false,

    init() {
      this.paddle.x = (canvas.width - this.paddle.w) / 2;
      this.ball.x = canvas.width / 2;
      this.ball.y = 200;
      this.ball.vx = (Math.random() < 0.5 ? 2.4 : -2.4);
      this.ball.vy = -2.5;
      this.bricks = [];

      const rows = 4;
      const cols = 9;
      const bW = 58;
      const bH = 14;
      const colors = ['#ff6b81', '#feca57', '#1dd1a1', '#54a0ff'];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this.bricks.push({
            x: 14 + c * (bW + 6),
            y: 36 + r * (bH + 6),
            w: bW,
            h: bH,
            color: colors[r],
            alive: true
          });
        }
      }
    },

    update() {
      const p = this.paddle;
      const b = this.ball;

      if (this.moveLeft) p.x -= p.speed;
      if (this.moveRight) p.x += p.speed;

      if (p.x < 0) p.x = 0;
      if (p.x + p.w > canvas.width) p.x = canvas.width - p.w;

      b.x += b.vx;
      b.y += b.vy;

      if (b.x - b.r < 0 || b.x + b.r > canvas.width) {
        b.vx *= -1;
        playSfx('jump');
      }
      if (b.y - b.r < 0) {
        b.vy *= -1;
        playSfx('jump');
      }

      if (
        b.y + b.r >= p.y &&
        b.y - b.r <= p.y + p.h &&
        b.x >= p.x &&
        b.x <= p.x + p.w
      ) {
        b.vy = -Math.abs(b.vy);
        const hitOffset = (b.x - (p.x + p.w / 2)) / (p.w / 2);
        b.vx = hitOffset * 3.2;
        playSfx('jump');
        spawnParticles(b.x, p.y, '#ffffff', 4);
      }

      let remaining = 0;
      this.bricks.forEach(brick => {
        if (!brick.alive) return;
        remaining++;

        if (
          b.x + b.r > brick.x &&
          b.x - b.r < brick.x + brick.w &&
          b.y + b.r > brick.y &&
          b.y - b.r < brick.y + brick.h
        ) {
          brick.alive = false;
          b.vy *= -1;
          score += 20;
          updateHUD();
          playSfx('coin');
          spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 8);
        }
      });

      if (remaining === 0) {
        score += 100;
        this.init();
      }

      if (b.y - b.r > canvas.height) {
        gameOver('A BOLINHA CAIU!');
      }
    },

    draw() {
      ctx.fillStyle = '#222f3e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.bricks.forEach(brick => {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      });

      const char = charactersData.breakout[selectedCharacter.breakout];
      ctx.fillStyle = char.color;
      ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.ball.x - this.ball.r, this.ball.y - this.ball.r, this.ball.r * 2, this.ball.r * 2);
    }
  };

  // 4. RIO DE BATALHA
  const riverGame = {
    player: { x: 285, y: 240, w: 26, h: 26, speed: 3.6 },
    bullets: [],
    enemies: [],
    fuels: [],
    fuelLevel: 100,
    scrollOffset: 0,
    riverLeft: 120,
    riverRight: 480,
    spawnTimer: 0,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,

    init() {
      this.player.x = 285;
      this.player.y = 240;
      this.bullets = [];
      this.enemies = [];
      this.fuels = [];
      this.fuelLevel = 100;
      this.scrollOffset = 0;
      this.riverLeft = 120;
      this.riverRight = 480;
      this.spawnTimer = 0;
    },

    shoot() {
      if (this.bullets.length < 4) {
        this.bullets.push({
          x: this.player.x + this.player.w / 2 - 2,
          y: this.player.y - 6,
          w: 4,
          h: 8
        });
        playSfx('shoot');
      }
    },

    update() {
      const p = this.player;

      if (this.moveLeft) p.x -= p.speed;
      if (this.moveRight) p.x += p.speed;
      if (this.moveUp) p.y -= p.speed * 0.8;
      if (this.moveDown) p.y += p.speed * 0.8;

      if (p.y < 30) p.y = 30;
      if (p.y + p.h > canvas.height - 15) p.y = canvas.height - 15 - p.h;

      this.fuelLevel -= 0.038;
      if (this.fuelLevel <= 0) {
        gameOver('FICOU SEM COMBUSTÍVEL!');
        return;
      }

      this.scrollOffset = (this.scrollOffset + 1.6) % 40;
      this.riverLeft = 120 + Math.sin(Date.now() / 2000) * 30;
      this.riverRight = 480 + Math.sin(Date.now() / 2000) * 30;

      if (p.x < this.riverLeft || p.x + p.w > this.riverRight) {
        spawnParticles(p.x + p.w / 2, p.y + p.h / 2, '#ff4757', 15);
        gameOver('BATEU NA MARGEM!');
        return;
      }

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.y -= 6.5;
        if (b.y < -10) this.bullets.splice(i, 1);
      }

      this.spawnTimer++;
      if (this.spawnTimer > 48) {
        this.spawnTimer = 0;
        const xPos = this.riverLeft + 20 + Math.random() * (this.riverRight - this.riverLeft - 60);

        if (Math.random() < 0.35) {
          this.fuels.push({ x: xPos, y: -20, w: 22, h: 22 });
        } else {
          this.enemies.push({
            x: xPos,
            y: -24,
            w: 26,
            h: 20,
            type: Math.random() < 0.5 ? 'boat' : 'heli',
            vx: (Math.random() - 0.5) * 1.2
          });
        }
      }

      for (let i = this.fuels.length - 1; i >= 0; i--) {
        const f = this.fuels[i];
        f.y += 1.6;

        if (
          p.x < f.x + f.w &&
          p.x + p.w > f.x &&
          p.y < f.y + f.h &&
          p.y + p.h > f.y
        ) {
          this.fuelLevel = Math.min(100, this.fuelLevel + 35);
          playSfx('coin');
          spawnParticles(f.x + 10, f.y + 10, '#feca57', 6);
          this.fuels.splice(i, 1);
          continue;
        }

        if (f.y > canvas.height) this.fuels.splice(i, 1);
      }

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const en = this.enemies[i];
        en.y += 1.5;
        en.x += en.vx;

        if (en.x < this.riverLeft + 5 || en.x + en.w > this.riverRight - 5) {
          en.vx *= -1;
        }

        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const b = this.bullets[j];
          if (
            b.x < en.x + en.w &&
            b.x + b.w > en.x &&
            b.y < en.y + en.h &&
            b.y + b.h > en.y
          ) {
            spawnParticles(en.x + en.w / 2, en.y + en.h / 2, '#ff6b81', 10);
            playSfx('hit');
            score += 20;
            updateHUD();
            this.enemies.splice(i, 1);
            this.bullets.splice(j, 1);
            break;
          }
        }

        if (
          p.x < en.x + en.w &&
          p.x + p.w > en.x &&
          p.y < en.y + en.h &&
          p.y + p.h > en.y
        ) {
          spawnParticles(p.x + p.w / 2, p.y + p.h / 2, '#ff4757', 15);
          gameOver('BATEU NUM INIMIGO!');
          return;
        }

        if (en.y > canvas.height) this.enemies.splice(i, 1);
      }
    },

    draw() {
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1e90ff';
      ctx.fillRect(this.riverLeft, 0, this.riverRight - this.riverLeft, canvas.height);

      ctx.fillStyle = '#10ac84';
      ctx.fillRect(this.riverLeft - 6, 0, 6, canvas.height);
      ctx.fillRect(this.riverRight, 0, 6, canvas.height);

      this.fuels.forEach(f => {
        ctx.fillStyle = '#ffa502';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(f.x + 3, f.y + 3, f.w - 6, f.h - 6);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(f.x + 5, f.y + 8, f.w - 10, 3);
      });

      this.enemies.forEach(en => {
        ctx.fillStyle = en.type === 'boat' ? '#2f3542' : '#57606f';
        ctx.fillRect(en.x, en.y + 4, en.w, en.h - 8);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(en.x + 6, en.y, en.w - 12, en.h);
      });

      ctx.fillStyle = '#feca57';
      this.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

      const char = charactersData.river[selectedCharacter.river];
      const p = this.player;
      ctx.fillStyle = char.color;
      ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
      ctx.fillStyle = char.secondary;
      ctx.fillRect(p.x + p.w / 2 - 2, p.y, 4, p.h);

      ctx.fillStyle = '#1e272e';
      ctx.fillRect(20, 290, 100, 14);
      ctx.fillStyle = this.fuelLevel > 25 ? '#2ed573' : '#ff4757';
      ctx.fillRect(22, 292, Math.max(0, this.fuelLevel * 0.96), 10);
    }
  };

  // 5. BOLICHE
  const bowlingGame = {
    ball: { x: 300, y: 270, r: 10, vx: 0, vy: 0, rolling: false },
    aimX: 300,
    aimDir: 1,
    pins: [],
    power: 0,
    powerDir: 1,
    phase: 'AIM',
    shotAttempt: 1,
    feedbackText: '',
    feedbackTimer: 0,
    pauseTimer: 0,

    init() {
      this.shotAttempt = 1;
      this.feedbackText = '';
      this.feedbackTimer = 0;
      this.resetAllPins();
      this.resetBall();
    },

    resetAllPins() {
      this.pins = [];
      const rows = [
        [-30, -10, 10, 30],
        [-20, 0, 20],
        [-10, 10],
        [0]
      ];
      rows.forEach((row, rIdx) => {
        row.forEach(xOff => {
          this.pins.push({
            baseX: 300 + xOff,
            baseY: 60 + rIdx * 12,
            alive: true,
            fallOffset: 0
          });
        });
      });
    },

    resetBall() {
      this.ball.x = 300;
      this.ball.y = 270;
      this.ball.r = 10;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.rolling = false;
      this.aimX = 300;
      this.power = 0;
      this.powerDir = 1;
      this.phase = 'AIM';
    },

    triggerAction() {
      if (this.phase === 'AIM') {
        this.phase = 'POWER';
        playSfx('coin');
      } else if (this.phase === 'POWER') {
        this.phase = 'ROLL';
        this.ball.rolling = true;
        this.ball.x = this.aimX;
        this.ball.vx = (this.aimX - 300) * 0.045;
        this.ball.vy = -(3.4 + (this.power / 100) * 3.2);
        playSfx('jump');
      }
    },

    update() {
      if (this.phase === 'AIM') {
        this.aimX += this.aimDir * 2.4;
        if (this.aimX < 235) { this.aimX = 235; this.aimDir = 1; }
        if (this.aimX > 365) { this.aimX = 365; this.aimDir = -1; }
      }

      if (this.phase === 'POWER') {
        this.power += this.powerDir * 3.2;
        if (this.power > 100) { this.power = 100; this.powerDir = -1; }
        if (this.power < 0) { this.power = 0; this.powerDir = 1; }
      }

      if (this.phase === 'ROLL' && this.ball.rolling) {
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.r = Math.max(4, 10 * (this.ball.y / 270));

        let hitThisFrame = 0;
        this.pins.forEach(pin => {
          if (!pin.alive) return;
          const dist = Math.hypot(this.ball.x - pin.baseX, this.ball.y - pin.baseY);
          if (dist < this.ball.r + 8) {
            pin.alive = false;
            pin.fallOffset = (Math.random() - 0.5) * 8;
            hitThisFrame++;
            score += 10;
            spawnParticles(pin.baseX, pin.baseY, '#ffffff', 5);
          }
        });

        if (hitThisFrame > 0) {
          updateHUD();
          playSfx('hit');
        }

        if (this.ball.y < 50) {
          this.ball.rolling = false;
          this.phase = 'ROUND_OVER';
          this.pauseTimer = 0;

          const remaining = this.pins.filter(p => p.alive).length;

          if (this.shotAttempt === 1) {
            if (remaining === 0) {
              score += 100;
              updateHUD();
              playSfx('strike');
              this.feedbackText = 'STRIKE! +100 PTS';
              this.feedbackTimer = 60;
              this.shotAttempt = 1;
              setTimeout(() => this.resetAllPins(), 700);
            } else {
              this.feedbackText = `RESTAM ${remaining} PINOS! 2ª CHANCE`;
              this.feedbackTimer = 60;
              this.shotAttempt = 2;
            }
          } else {
            if (remaining === 0) {
              score += 50;
              updateHUD();
              playSfx('strike');
              this.feedbackText = 'SPARE! +50 PTS';
              this.feedbackTimer = 60;
            } else {
              this.feedbackText = `FIM DA RODADA!`;
              this.feedbackTimer = 50;
            }
            this.shotAttempt = 1;
            setTimeout(() => this.resetAllPins(), 700);
          }
        }
      }

      if (this.phase === 'ROUND_OVER') {
        this.pauseTimer++;
        if (this.pauseTimer > 45) {
          this.resetBall();
        }
      }

      if (this.feedbackTimer > 0) {
        this.feedbackTimer--;
      }
    },

    draw() {
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(250, 50);
      ctx.lineTo(350, 50);
      ctx.lineTo(440, 290);
      ctx.lineTo(160, 290);
      ctx.closePath();
      ctx.fill();

      this.pins.forEach(pin => {
        if (pin.alive) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pin.baseX - 3, pin.baseY - 6, 6, 12);
          ctx.fillStyle = '#ff4757';
          ctx.fillRect(pin.baseX - 3, pin.baseY - 3, 6, 2);
        } else {
          ctx.fillStyle = '#a4b0be';
          ctx.fillRect(pin.baseX - 5 + pin.fallOffset, pin.baseY, 10, 4);
        }
      });

      if (this.phase === 'AIM' || this.phase === 'POWER') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.moveTo(this.aimX, 260);
        ctx.lineTo(this.aimX + (this.aimX - 300) * 0.4, 60);
        ctx.stroke();
      }

      const char = charactersData.bowling[selectedCharacter.bowling];
      const bx = this.ball.rolling ? this.ball.x : this.aimX;
      ctx.fillStyle = char.color;
      ctx.beginPath();
      ctx.arc(bx, this.ball.y, this.ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = char.ring;
      ctx.fillRect(bx - 2, this.ball.y - 2, 2, 2);
      ctx.fillRect(bx + 2, this.ball.y - 2, 2, 2);

      if (this.phase === 'POWER') {
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(470, 95, 18, 120);
        ctx.fillStyle = '#ff4757';
        const bh = (this.power / 100) * 116;
        ctx.fillRect(472, 213 - bh, 14, bh);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('FORÇA', 463, 85);
      }

      ctx.fillStyle = '#1e272e';
      ctx.fillRect(15, 12, 120, 24);
      ctx.fillStyle = this.shotAttempt === 1 ? '#2ed573' : '#ffa502';
      ctx.font = '9px monospace';
      ctx.fillText(`BOLA: ${this.shotAttempt}ª CHANCE`, 22, 28);

      if (this.feedbackTimer > 0) {
        ctx.fillStyle = '#feca57';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.feedbackText, canvas.width / 2, 160);
        ctx.textAlign = 'left';
      }
    }
  };

  // Painel de Instruções Dinâmico
  function updateGuidePanel() {
    gCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    guideTitle.textContent = `MANUAL: ${hudName.textContent}`;
    guideTextContainer.innerHTML = '';

    if (currentGame === 'runner') {
      const char = charactersData.runner[selectedCharacter.runner];
      drawRunnerAnimal(gCtx, 15, 30, char.id, true, false);
      gCtx.fillStyle = '#778ca3';
      gCtx.fillRect(65, 38, 18, 18);
      drawPixelFood(gCtx, 115, 36, char.foodType);

      guideTextContainer.innerHTML = `
        <div class="guide-line"><span class="guide-badge">CRONÔMETRO [01:00]</span> Você tem 60 segundos para pegar o máximo de comidinhas e desviar dos obstáculos!</div>
        <div class="guide-line"><span class="guide-badge">PULAR [W / CIMA]</span> Salte por cima de pedras e arbustos.</div>
        <div class="guide-line"><span class="guide-badge">ABAIXAR [S / BAIXO]</span> Deslize por baixo de obstáculos altos.</div>
        <div class="guide-line"><span class="guide-badge">COMIDA FAVORITA</span> Colete <strong>${char.foodName}</strong> para bônus de pontos!</div>
      `;
    } else if (currentGame === 'flappy') {
      const char = charactersData.flappy[selectedCharacter.flappy];
      drawFlappyCharacter(gCtx, 20, 35, char.type);
      gCtx.fillStyle = '#10ac84';
      gCtx.fillRect(100, 0, 24, 30);
      gCtx.fillRect(100, 60, 24, 30);

      guideTextContainer.innerHTML = `
        <div class="guide-line"><span class="guide-badge">CRONÔMETRO [01:00]</span> Passe pelo maior número de canos em 60 segundos! (+10 PTS cada)</div>
        <div class="guide-line"><span class="guide-badge">VOAR [ESPAÇO / TOQUE]</span> Cada clique dá um impulso para cima.</div>
        <div class="guide-line"><span class="guide-badge">OBJETIVO</span> Passe pelo vão seguro entre os canos verdes (+10 PTS).</div>
      `;
    } else if (currentGame === 'breakout') {
      gCtx.fillStyle = '#ff6b81';
      gCtx.fillRect(15, 15, 30, 10);
      gCtx.fillStyle = '#feca57';
      gCtx.fillRect(55, 15, 30, 10);
      gCtx.fillStyle = '#1dd1a1';
      gCtx.fillRect(95, 15, 30, 10);
      gCtx.fillStyle = '#00d2d3';
      gCtx.fillRect(50, 65, 45, 10);

      guideTextContainer.innerHTML = `
        <div class="guide-line"><span class="guide-badge">CRONÔMETRO [01:00]</span> Limpe as paredes de blocos o mais rápido possível antes do tempo zerar!</div>
        <div class="guide-line"><span class="guide-badge">SETAS ESQ / DIR</span> Mova a raquete para rebater a bola suavemente.</div>
        <div class="guide-line"><span class="guide-badge">OBJETIVO</span> Destrua todos os blocos (+20 PTS cada) sem deixar cair.</div>
      `;
    } else if (currentGame === 'river') {
      gCtx.fillStyle = '#1e90ff';
      gCtx.fillRect(20, 0, 120, 90);
      gCtx.fillStyle = '#ffa502';
      gCtx.fillRect(70, 15, 18, 18);
      gCtx.fillStyle = '#feca57';
      gCtx.fillRect(72, 60, 14, 18);

      guideTextContainer.innerHTML = `
        <div class="guide-line"><span class="guide-badge">CRONÔMETRO [01:00]</span> Sobreviva e destrua inimigos em 1 minuto sem deixar o combustível acabar!</div>
        <div class="guide-line"><span class="guide-badge">W/A/S/D OU SETAS</span> Movimente-se livremente em 4 direções pelo rio.</div>
        <div class="guide-line"><span class="guide-badge">ESPAÇO / DISPARAR</span> Destrua barcos e helicópteros inimigos (+20 PTS).</div>
        <div class="guide-line"><span class="guide-badge">TANQUES FUEL</span> Passe por cima dos tanques para não ficar sem combustível!</div>
      `;
    } else if (currentGame === 'bowling') {
      gCtx.fillStyle = '#ffffff';
      gCtx.fillRect(75, 15, 8, 14);
      const char = charactersData.bowling[selectedCharacter.bowling];
      gCtx.fillStyle = char.color;
      gCtx.beginPath();
      gCtx.arc(79, 65, 10, 0, Math.PI * 2);
      gCtx.fill();

      guideTextContainer.innerHTML = `
        <div class="guide-line"><span class="guide-badge">CRONÔMETRO [01:00]</span> Derrube o máximo de pinos possível em 60 segundos! 10 PTS por pino | STRIKE (+100 BÔNUS) | SPARE (+50 BÔNUS).</div>
        <div class="guide-line"><span class="guide-badge">CHANCES</span> Não derrubou tudo? Ganhe a <strong>2ª Bola</strong> com os pinos que sobraram!</div>
        <div class="guide-line"><span class="guide-badge">LANÇAMENTO</span> A mira oscila viva: clique em <strong>LANÇAR</strong> para travar a mira e depois na força!</div>
      `;
    }
  }

  // Loop de Renderização e Tempo
  function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const elapsed = currentTime - lastFrameTime;
    if (elapsed < fpsInterval) return;
    lastFrameTime = currentTime - (elapsed % fpsInterval);

    // Contagem Regressiva dos 60 segundos
    if (gameState === 'RUNNING') {
      const now = performance.now();
      if (now - lastSecondTimestamp >= 1000) {
        gameTimeLeft--;
        lastSecondTimestamp = now;
        updateHUD();

        if (gameTimeLeft <= 0) {
          gameTimeLeft = 0;
          gameOver('O TEMPO ACABOU!');
          return;
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentGame === 'runner') {
      if (gameState === 'RUNNING') runner.update();
      runner.draw();
    } else if (currentGame === 'flappy') {
      if (gameState === 'RUNNING') flappy.update();
      flappy.draw();
    } else if (currentGame === 'breakout') {
      if (gameState === 'RUNNING') breakout.update();
      breakout.draw();
    } else if (currentGame === 'river') {
      if (gameState === 'RUNNING') riverGame.update();
      riverGame.draw();
    } else if (currentGame === 'bowling') {
      if (gameState === 'RUNNING') bowlingGame.update();
      bowlingGame.draw();
    }

    updateAndDrawParticles();
  }

  function startGame() {
    score = 0;
    particles = [];
    gameTimeLeft = 60;
    lastSecondTimestamp = performance.now();
    updateHUD();
    gameState = 'RUNNING';
    overlay.style.display = 'none';

    if (currentGame === 'runner') runner.init();
    if (currentGame === 'flappy') flappy.init();
    if (currentGame === 'breakout') breakout.init();
    if (currentGame === 'river') riverGame.init();
    if (currentGame === 'bowling') bowlingGame.init();

    playSfx('coin');
  }

  function gameOver(reason) {
    gameState = 'GAMEOVER';
    playSfx('hit');

    if (score > hiScores[currentGame]) {
      hiScores[currentGame] = score;
      localStorage.setItem(`pixel_record_${currentGame}`, score);
    }
    updateHUD();

    overlayTitle.textContent = reason || 'FIM DE JOGO!';
    overlayDesc.textContent = `VOCÊ FEZ ${score} PONTOS! QUER TENTAR DE NOVO?`;
    btnAction.textContent = 'JOGAR NOVAMENTE';
    overlay.style.display = 'flex';
  }

  // Atualizador do HUD com Timer 01:00
  function updateHUD() {
    const min = String(Math.floor(gameTimeLeft / 60)).padStart(2, '0');
    const sec = String(gameTimeLeft % 60).padStart(2, '0');
    if (hudTimer) hudTimer.textContent = `TEMPO: ${min}:${sec}`;

    hudScore.textContent = `PONTOS: ${score}`;
    hudRecord.textContent = `RECORDE: ${hiScores[currentGame]}`;
  }

  function renderCharacterButtons() {
    charOptionsContainer.innerHTML = '';
    const list = charactersData[currentGame];

    list.forEach((char, idx) => {
      const btn = document.createElement('button');
      btn.className = `char-btn ${selectedCharacter[currentGame] === idx ? 'active' : ''}`;
      btn.innerHTML = `<span class="color-dot" style="background-color: ${char.badge}"></span> ${char.name}`;
      btn.addEventListener('click', () => {
        selectedCharacter[currentGame] = idx;
        renderCharacterButtons();
        updateGuidePanel();
        playSfx('coin');
      });
      charOptionsContainer.appendChild(btn);
    });
  }

  function switchGame(gameKey) {
    currentGame = gameKey;
    gameState = 'START';
    particles = [];
    gameTimeLeft = 60;

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.game === gameKey);
    });

    renderCharacterButtons();

    runnerControls.style.display = 'none';
    singleActionControls.style.display = 'none';
    lrControls.style.display = 'none';
    riverControls.style.display = 'none';
    bowlingControls.style.display = 'none';

    if (gameKey === 'runner') {
      hudName.textContent = 'SALTO ANIMAL';
      runnerControls.style.display = 'flex';
      runner.init();
    } else if (gameKey === 'flappy') {
      hudName.textContent = 'VOO PIXEL';
      singleActionControls.style.display = 'flex';
      flappy.init();
    } else if (gameKey === 'breakout') {
      hudName.textContent = 'REBATIDA';
      lrControls.style.display = 'flex';
      breakout.init();
    } else if (gameKey === 'river') {
      hudName.textContent = 'RIO DE BATALHA';
      riverControls.style.display = 'flex';
      riverGame.init();
    } else if (gameKey === 'bowling') {
      hudName.textContent = 'BOLICHE';
      bowlingControls.style.display = 'flex';
      bowlingGame.init();
    }

    score = 0;
    updateHUD();

    overlayTitle.textContent = hudName.textContent;
    overlayDesc.textContent = 'ESCOLHA SEU PERSONAGEM ACIMA E CLIQUE EM JOGAR!';
    btnAction.textContent = 'JOGAR AGORA';
    overlay.style.display = 'flex';

    updateGuidePanel();
  }

  btnAction.addEventListener('click', startGame);

  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => switchGame(tab.dataset.game));
  });

  // Eventos de Teclado
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      if (gameState === 'RUNNING') {
        if (currentGame === 'flappy') flappy.flap();
        if (currentGame === 'river') riverGame.shoot();
        if (currentGame === 'bowling') bowlingGame.triggerAction();
      } else {
        startGame();
      }
      e.preventDefault();
    }

    if (gameState === 'RUNNING') {
      if (currentGame === 'runner') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.code === 'Space') runner.jump();
        if (e.key === 'ArrowDown' || e.key === 's') runner.setDuck(true);
      } else if (currentGame === 'breakout') {
        if (e.key === 'ArrowLeft' || e.key === 'a') breakout.moveLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd') breakout.moveRight = true;
      } else if (currentGame === 'river') {
        if (e.key === 'ArrowLeft' || e.key === 'a') riverGame.moveLeft = true;
        if (e.key === 'ArrowRight' || e.key === 'd') riverGame.moveRight = true;
        if (e.key === 'ArrowUp' || e.key === 'w') riverGame.moveUp = true;
        if (e.key === 'ArrowDown' || e.key === 's') riverGame.moveDown = true;
      } else if (currentGame === 'bowling' && bowlingGame.phase === 'AIM') {
        if (e.key === 'ArrowLeft' || e.key === 'a') bowlingGame.aimX = Math.max(220, bowlingGame.aimX - 6);
        if (e.key === 'ArrowRight' || e.key === 'd') bowlingGame.aimX = Math.min(380, bowlingGame.aimX + 6);
      }
    }
  });

  window.addEventListener('keyup', e => {
    if (currentGame === 'runner') {
      if (e.key === 'ArrowDown' || e.key === 's') runner.setDuck(false);
    } else if (currentGame === 'breakout') {
      if (e.key === 'ArrowLeft' || e.key === 'a') breakout.moveLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') breakout.moveRight = false;
    } else if (currentGame === 'river') {
      if (e.key === 'ArrowLeft' || e.key === 'a') riverGame.moveLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') riverGame.moveRight = false;
      if (e.key === 'ArrowUp' || e.key === 'w') riverGame.moveUp = false;
      if (e.key === 'ArrowDown' || e.key === 's') riverGame.moveDown = false;
    }
  });

  // Eventos de Touch
  btnJump.addEventListener('touchstart', e => { e.preventDefault(); runner.jump(); });
  btnJump.addEventListener('mousedown', () => runner.jump());

  btnDuck.addEventListener('touchstart', e => { e.preventDefault(); runner.setDuck(true); });
  btnDuck.addEventListener('touchend', e => { e.preventDefault(); runner.setDuck(false); });
  btnDuck.addEventListener('mousedown', () => runner.setDuck(true));
  btnDuck.addEventListener('mouseup', () => runner.setDuck(false));

  btnSingleAction.addEventListener('touchstart', e => { e.preventDefault(); flappy.flap(); });
  btnSingleAction.addEventListener('mousedown', () => flappy.flap());

  function setupHold(btn, onStart, onEnd) {
    btn.addEventListener('touchstart', e => { e.preventDefault(); onStart(); });
    btn.addEventListener('touchend', e => { e.preventDefault(); onEnd(); });
    btn.addEventListener('mousedown', onStart);
    btn.addEventListener('mouseup', onEnd);
  }

  setupHold(btnMoveLeft, () => breakout.moveLeft = true, () => breakout.moveLeft = false);
  setupHold(btnMoveRight, () => breakout.moveRight = true, () => breakout.moveRight = false);

  setupHold(btnRivUp, () => riverGame.moveUp = true, () => riverGame.moveUp = false);
  setupHold(btnRivDown, () => riverGame.moveDown = true, () => riverGame.moveDown = false);
  setupHold(btnRivLeft, () => riverGame.moveLeft = true, () => riverGame.moveLeft = false);
  setupHold(btnRivRight, () => riverGame.moveRight = true, () => riverGame.moveRight = false);

  btnRiverShoot.addEventListener('touchstart', e => { e.preventDefault(); riverGame.shoot(); });
  btnRiverShoot.addEventListener('mousedown', () => riverGame.shoot());

  setupHold(btnBowlLeft, () => bowlingGame.aimX = Math.max(220, bowlingGame.aimX - 8), () => {});
  setupHold(btnBowlRight, () => bowlingGame.aimX = Math.min(380, bowlingGame.aimX + 8), () => {});
  btnBowlThrow.addEventListener('touchstart', e => { e.preventDefault(); bowlingGame.triggerAction(); });
  btnBowlThrow.addEventListener('mousedown', () => bowlingGame.triggerAction());

  switchGame('runner');
  requestAnimationFrame(gameLoop);
});
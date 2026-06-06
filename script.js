/* ========================================
   HAMSTER PET — Game Logic
   ======================================== */

const HamsterPet = (() => {
  // --- State ---
  const state = {
    name: 'Bolita',
    stats: {
      hunger: 80,
      happiness: 70,
      energy: 90,
      cleanliness: 85,
    },
    mood: 'happy',
    isSpeaking: false,
    isSoundOn: true,
    currentAction: null,
    birthTime: Date.now(),
    lastUpdate: Date.now(),
    // AI
    apiKey: '',
    geminiModel: 'gemini-2.0-flash',
    chatHistory: [],      // {role, text} for Gemini context
    memories: [],          // persistent facts the hamster remembers
    isAiEnabled: false,
    isAiThinking: false,
  };

  // --- Load saved state ---
  function loadState() {
    try {
      const saved = localStorage.getItem('hamster_pet_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state.stats, parsed.stats);
        state.name = parsed.name || 'Bolita';
        state.isSoundOn = parsed.isSoundOn !== undefined ? parsed.isSoundOn : true;
        state.birthTime = parsed.birthTime || Date.now();

        // Decay stats based on time away
        const minutesAway = (Date.now() - (parsed.lastSave || Date.now())) / 60000;
        if (minutesAway > 1) {
          const decay = Math.min(minutesAway * 0.5, 40);
          state.stats.hunger = Math.max(0, state.stats.hunger - decay);
          state.stats.energy = Math.max(0, state.stats.energy - decay * 0.3);
          state.stats.cleanliness = Math.max(0, state.stats.cleanliness - decay * 0.2);
          state.stats.happiness = Math.max(0, state.stats.happiness - decay * 0.4);
        }
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem('hamster_pet_state', JSON.stringify({
        stats: state.stats,
        name: state.name,
        isSoundOn: state.isSoundOn,
        birthTime: state.birthTime,
        lastSave: Date.now(),
      }));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  }

  // --- Phrases ---
  const phrases = {
    idle: [
      '¡Squeak squeak, Abby! 🐹',
      '*se rasca la orejita* ¿Qué hacen hoy, chicas?',
      'Hmm... Abby, Pascal, ¿jugamos?',
      '*mueve los bigotitos* ¡Las extrañaba!',
      '¡Me gusta estar con ustedes!',
      '*corre en su rueda* ¡Miren, Abby! ¡Soy rápido!',
      '¿Tienes semillitas, Pascal? 🌻',
      '*se acicala el pelito* Quiero verme bonito para Abby y Pascal',
      '¡Squeak! ¡Pepe! ¡Mi humano favorito! 🐹',
    ],
    hungry: [
      '¡Abby, tengo hambreeee! 🥺',
      'Pascal, ¿me das una semillita?',
      'Mi pancita hace ruidos... ¡Abby, ayuda! 🌻',
      '*mira a Pascal con ojitos tristes*',
      '¡Chicas, comidaaaa por favoooor!',
    ],
    happy: [
      '¡SQUEAK! ¡Estoy feliz con Abby y Pascal! ✨',
      '¡Son las mejores humanas! 💖',
      '*da vueltas de alegría* ¡Las quiero, chicas!',
      '¡Te quiero mucho, Abby! 🐹💕',
      '¡Wiiii! ¡Pascal, la vida es bella!',
    ],
    sad: [
      '*squeak triste* Abby, ven... 😢',
      'Me siento solito sin ustedes...',
      'Pascal, ¿puedes jugar conmigo?',
      '*se esconde en la viruta* Las extraño...',
      'Abby, Pascal, necesito cariñito... 🥺',
    ],
    tired: [
      '*bosteza*... Abby, tengo sueñito 😴',
      'Mis ojitos se cierran, Pascal...',
      'Chicas, ¿puedo dormir un ratito?',
      '*se hace bolita al lado de Abby*',
      'Zzz... digo... ¡estoy despierto, Pascal! ...casi',
    ],
    dirty: [
      '¡Abby, necesito un bañito! 🛁',
      '*huele algo raro* Pascal, ¿soy yo?',
      '¡Chicas, quiero estar limpiecito!',
      'Mi pelito necesita cepillado, Abby...',
    ],
    eating: [
      '¡Ñom ñom ñom! ¡Gracias, Abby! 🌻',
      '*guarda en los cachetes* ¡Pascal, mira cuánto guardo!',
      '¡Está delicioso, chicas!',
      '¡Más semillitas, Abby! ¡Ñom!',
      '*mastica feliz mirando a Pascal*',
    ],
    playing: [
      '¡WIIII! ¡Qué divertido, Abby! 🎉',
      '*corre por todos lados* ¡Pascal, mírame!',
      '¡Atrápame si puedes, chicas!',
      '¡Me encanta jugar con ustedes!',
      '*da piruetas para Abby y Pascal*',
    ],
    sleeping: [
      'Zzz... Abby... semillitas... Zzz...',
      '*ronquido suavecito al lado de Pascal*',
      'Zzz... Abby y Pascal son... mis mejores... Zzz...',
    ],
    petted: [
      '¡Squeeeak! ¡Cariñitos de Abby! 💕',
      '*se derrite de amor con Pascal*',
      '¡Más por favor, chicas! ✨',
      '*ronronea en las manos de Abby*',
      '¡Me encantan las caricias de Pascal!',
    ],
    clean: [
      '¡Estoy reluciente, Abby! ✨',
      '*se sacude feliz para Pascal*',
      '¡Qué fresquito! ¡Gracias, chicas! 🛁',
      '¡Limpiecito y contento con Abby y Pascal!',
    ],
    ballCatch: [
      '¡La atrapé, Abby! ¡Otra vez! 🎾',
      '¡WIIII! ¡Pascal, tíramela otra vez!',
      '¡Squeak! ¡Soy muy rápido, chicas! ⚡',
      '*atrapa la pelota* ¡Abby, viste eso!',
      '¡Esa fue genial, Pascal! ¡Más! 🐹',
      '¡Me encanta este juego con ustedes! 🎉',
    ],
    ballMiss: [
      '¡Casi la atrapo, Abby! Otra vez... 😅',
      '¡Uy! Se me escapó, Pascal 🙈',
      '*corre detrás de la pelota* ¡Espérenme, chicas!',
    ],
  };

  // --- DOM Cache ---
  let els = {};

  function cacheDom() {
    els = {
      hamster: document.getElementById('hamster'),
      speechBubble: document.getElementById('speech-bubble'),
      speechText: document.getElementById('speech-text'),
      nameInput: document.getElementById('pet-name-input'),
      volumeToggle: document.getElementById('volume-toggle'),
      moodEmoji: document.getElementById('mood-emoji'),
      moodText: document.getElementById('mood-text'),
      ageDisplay: document.getElementById('age-display'),
      zzzContainer: document.getElementById('zzz-container'),
      // Stats
      hungerBar: document.getElementById('hunger-bar'),
      happinessBar: document.getElementById('happiness-bar'),
      energyBar: document.getElementById('energy-bar'),
      cleanlinessBar: document.getElementById('cleanliness-bar'),
      hungerValue: document.getElementById('hunger-value'),
      happinessValue: document.getElementById('happiness-value'),
      energyValue: document.getElementById('energy-value'),
      cleanlinessValue: document.getElementById('cleanliness-value'),
      hungerWrapper: document.getElementById('hunger-wrapper'),
      happinessWrapper: document.getElementById('happiness-wrapper'),
      energyWrapper: document.getElementById('energy-wrapper'),
      cleanlinessWrapper: document.getElementById('cleanliness-wrapper'),
      // Buttons
      feedBtn: document.getElementById('btn-feed'),
      playBtn: document.getElementById('btn-play'),
      sleepBtn: document.getElementById('btn-sleep'),
      cleanBtn: document.getElementById('btn-clean'),
      petBtn: document.getElementById('btn-pet'),
      talkBtn: document.getElementById('btn-talk'),
      // Ball
      ball: document.getElementById('throwable-ball'),
      hamsterScene: document.querySelector('.hamster-scene'),
      // Seed
      seed: document.getElementById('draggable-seed'),
      // Chat & AI
      chatInput: document.getElementById('chat-input'),
      chatSend: document.getElementById('chat-send'),
      typingIndicator: document.getElementById('typing-indicator'),
      settingsToggle: document.getElementById('settings-toggle'),
      settingsModal: document.getElementById('settings-modal'),
      apiKeyInput: document.getElementById('api-key-input'),
      modelSelect: document.getElementById('gemini-model-select'),
      modalCancel: document.getElementById('modal-cancel'),
      modalSave: document.getElementById('modal-save'),
      aiDot: document.getElementById('ai-dot'),
      aiStatusText: document.getElementById('ai-status-text'),
      memoryCount: document.getElementById('memory-count'),
      memoryClear: document.getElementById('memory-clear'),
    };
  }

  // --- Audio System ---
  let currentAudio = null;

  function playAudio(src) {
    if (!state.isSoundOn) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(src);
    state.isSpeaking = true;
    currentAudio.onended = () => { state.isSpeaking = false; };
    currentAudio.onerror = () => { state.isSpeaking = false; };
    
    currentAudio.play().catch(err => {
      console.warn('Failed to play audio:', src, err);
      state.isSpeaking = false;
    });
  }

  function playPhraseAudio(category, index) {
    const src = `sounds/${category}_${index + 1}.mp3`;
    playAudio(src);
  }

  const inlineAudioMap = {
    'Ya estoy llenito, chicas': 'sounds/inline_full.mp3',
    'Chicas, estoy muy cansadito': 'sounds/inline_tired.mp3',
    'Abby, Pascal, desperté con energía': 'sounds/inline_awake.mp3',
    'Chicas, ya estoy limpiecito': 'sounds/inline_clean.mp3',
    'Abby, Pascal, ahora puedo pensar y recordar': 'sounds/inline_ai_on.mp3',
    '¿Abby? ¿Pascal? ¿Dónde estoy?': 'sounds/inline_amnesia.mp3'
  };

  function speak(text) {
    const audioSrc = inlineAudioMap[text];
    if (audioSrc) {
      playAudio(audioSrc);
    }
  }

  // --- Bubble ---
  function showBubble(text, duration = 4000) {
    els.speechText.textContent = text;
    els.speechBubble.classList.add('visible');

    clearTimeout(state._bubbleTimer);
    state._bubbleTimer = setTimeout(() => {
      els.speechBubble.classList.remove('visible');
    }, duration);
  }

  function say(category) {
    const list = phrases[category] || phrases.idle;
    const index = Math.floor(Math.random() * list.length);
    const text = list[index];
    showBubble(text);
    playPhraseAudio(category, index);
  }

  // --- Particles ---
  function spawnParticles(emoji, count = 5) {
    const scene = document.querySelector('.hamster-scene');
    const rect = scene.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particle.textContent = emoji;
      particle.style.left = (rect.left + rect.width * 0.3 + Math.random() * rect.width * 0.4) + 'px';
      particle.style.top = (rect.top + rect.height * 0.2 + Math.random() * rect.height * 0.3) + 'px';
      particle.style.animationDelay = (i * 0.12) + 's';
      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 2000);
    }
  }

  // --- Hamster Animation ---
  function animateHamster(className, duration = 800) {
    els.hamster.classList.remove('idle', 'bounce', 'happy', 'eating', 'sleeping', 'catching');
    void els.hamster.offsetWidth; // Force reflow
    els.hamster.classList.add(className);

    if (className !== 'sleeping' && className !== 'idle') {
      setTimeout(() => {
        els.hamster.classList.remove(className);
        updateIdleState();
      }, duration);
    }
  }

  // --- Update Stats UI ---
  function updateStatsUI() {
    const { hunger, happiness, energy, cleanliness } = state.stats;

    els.hungerBar.style.width = hunger + '%';
    els.happinessBar.style.width = happiness + '%';
    els.energyBar.style.width = energy + '%';
    els.cleanlinessBar.style.width = cleanliness + '%';

    els.hungerValue.textContent = Math.round(hunger);
    els.happinessValue.textContent = Math.round(happiness);
    els.energyValue.textContent = Math.round(energy);
    els.cleanlinessValue.textContent = Math.round(cleanliness);

    // Warning state for low stats
    els.hungerWrapper.classList.toggle('warning', hunger < 25);
    els.happinessWrapper.classList.toggle('warning', happiness < 25);
    els.energyWrapper.classList.toggle('warning', energy < 25);
    els.cleanlinessWrapper.classList.toggle('warning', cleanliness < 25);
  }

  // --- Mood ---
  function updateMood() {
    const { hunger, happiness, energy, cleanliness } = state.stats;
    const avg = (hunger + happiness + energy + cleanliness) / 4;

    let mood, emoji;

    if (state.currentAction === 'sleeping') {
      mood = 'Durmiendo';
      emoji = '😴';
    } else if (hunger < 20) {
      mood = 'Hambriento';
      emoji = '😫';
    } else if (energy < 20) {
      mood = 'Cansado';
      emoji = '😪';
    } else if (cleanliness < 20) {
      mood = 'Sucio';
      emoji = '🫣';
    } else if (avg > 75) {
      mood = 'Feliz';
      emoji = '😊';
    } else if (avg > 50) {
      mood = 'Normal';
      emoji = '🙂';
    } else if (avg > 25) {
      mood = 'Triste';
      emoji = '😟';
    } else {
      mood = 'Mal';
      emoji = '😢';
    }

    state.mood = mood;
    els.moodEmoji.textContent = emoji;
    els.moodText.textContent = mood;
  }

  function updateAge() {
    const minutes = Math.floor((Date.now() - state.birthTime) / 60000);
    let ageText;
    if (minutes < 60) {
      ageText = `${minutes} min`;
    } else if (minutes < 1440) {
      ageText = `${Math.floor(minutes / 60)} horas`;
    } else {
      ageText = `${Math.floor(minutes / 1440)} días`;
    }
    els.ageDisplay.textContent = `🕐 Edad: ${ageText}`;
  }

  function updateIdleState() {
    if (state.currentAction) return;

    const { hunger, happiness, energy, cleanliness } = state.stats;

    if (energy < 15) {
      els.hamster.classList.add('sleeping');
      els.zzzContainer.style.display = 'block';
    } else {
      els.hamster.classList.remove('sleeping');
      els.zzzContainer.style.display = 'none';
      els.hamster.classList.add('idle');
    }
  }

  // --- Actions ---
  function disableButtons(ms) {
    const btns = [els.feedBtn, els.playBtn, els.sleepBtn, els.cleanBtn, els.petBtn, els.talkBtn];
    btns.forEach(b => b.disabled = true);
    setTimeout(() => btns.forEach(b => b.disabled = false), ms);
  }

  function feed() {
    if (state.stats.hunger >= 100) {
      showBubble('¡Ya estoy llenito, chicas! 🐹');
      speak('Ya estoy llenito, chicas');
      return;
    }

    state.currentAction = 'eating';
    animateHamster('eating', 2500);
    say('eating');
    spawnParticles('🌻', 6);
    disableButtons(2500);

    state.stats.hunger = Math.min(100, state.stats.hunger + 25);
    state.stats.happiness = Math.min(100, state.stats.happiness + 5);
    state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 3);

    setTimeout(() => {
      state.currentAction = null;
      updateIdleState();
    }, 2500);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function play() {
    if (state.stats.energy < 10) {
      showBubble('Chicas, estoy muy cansadito... 😴');
      speak('Chicas, estoy muy cansadito');
      return;
    }

    state.currentAction = 'playing';
    animateHamster('happy', 3000);
    say('playing');
    spawnParticles('⭐', 6);
    disableButtons(3000);

    state.stats.happiness = Math.min(100, state.stats.happiness + 20);
    state.stats.energy = Math.max(0, state.stats.energy - 15);
    state.stats.hunger = Math.max(0, state.stats.hunger - 8);
    state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 5);

    setTimeout(() => {
      state.currentAction = null;
      updateIdleState();
    }, 3000);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function sleep() {
    state.currentAction = 'sleeping';
    els.hamster.classList.remove('idle', 'bounce', 'happy', 'eating');
    els.hamster.classList.add('sleeping');
    els.zzzContainer.style.display = 'block';
    say('sleeping');
    disableButtons(5000);

    const restInterval = setInterval(() => {
      state.stats.energy = Math.min(100, state.stats.energy + 5);
      state.stats.hunger = Math.max(0, state.stats.hunger - 1);
      updateStatsUI();
      updateMood();
    }, 800);

    setTimeout(() => {
      clearInterval(restInterval);
      state.currentAction = null;
      els.hamster.classList.remove('sleeping');
      els.zzzContainer.style.display = 'none';
      animateHamster('bounce', 800);
      showBubble('¡Abby, Pascal, desperté con energía! ⚡');
      speak('Abby, Pascal, desperté con energía');
      updateIdleState();
      saveState();
    }, 5000);

    updateStatsUI();
    updateMood();
  }

  function clean() {
    if (state.stats.cleanliness >= 100) {
      showBubble('¡Chicas, ya estoy limpiecito! ✨');
      speak('Chicas, ya estoy limpiecito');
      return;
    }

    state.currentAction = 'cleaning';
    animateHamster('bounce', 2000);
    say('clean');
    spawnParticles('✨', 8);
    disableButtons(2000);

    state.stats.cleanliness = Math.min(100, state.stats.cleanliness + 30);
    state.stats.happiness = Math.min(100, state.stats.happiness + 5);

    setTimeout(() => {
      state.currentAction = null;
      updateIdleState();
    }, 2000);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function pet() {
    state.currentAction = 'petted';
    animateHamster('happy', 2000);
    say('petted');
    spawnParticles('💕', 7);
    disableButtons(2000);

    state.stats.happiness = Math.min(100, state.stats.happiness + 15);

    setTimeout(() => {
      state.currentAction = null;
      updateIdleState();
    }, 2000);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function talk() {
    const { hunger, happiness, energy, cleanliness } = state.stats;

    let category;
    if (hunger < 25) category = 'hungry';
    else if (energy < 25) category = 'tired';
    else if (cleanliness < 25) category = 'dirty';
    else if (happiness < 25) category = 'sad';
    else if (happiness > 70) category = 'happy';
    else category = 'idle';

    animateHamster('bounce', 600);
    say(category);
    disableButtons(1500);
  }

  // --- Passive Stat Decay ---
  function tick() {
    if (state.currentAction === 'sleeping') return;

    state.stats.hunger = Math.max(0, state.stats.hunger - 0.15);
    state.stats.happiness = Math.max(0, state.stats.happiness - 0.08);
    state.stats.energy = Math.max(0, state.stats.energy - 0.05);
    state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 0.04);

    updateStatsUI();
    updateMood();
    updateAge();
    updateIdleState();

    // Random idle chatter
    if (Math.random() < 0.02 && !state.currentAction) {
      const { hunger, happiness, energy } = state.stats;
      if (hunger < 20) say('hungry');
      else if (energy < 15) say('tired');
      else if (Math.random() < 0.3) say('idle');
    }

    saveState();
  }

  // --- Hamster Click ---
  function onHamsterClick() {
    if (state.currentAction) return;
    animateHamster('bounce', 600);
    spawnParticles('💖', 3);
    say('petted');

    state.stats.happiness = Math.min(100, state.stats.happiness + 5);
    updateStatsUI();
    updateMood();
    saveState();
  }

  // --- Volume Toggle ---
  function toggleSound() {
    state.isSoundOn = !state.isSoundOn;
    els.volumeToggle.textContent = state.isSoundOn ? '🔊' : '🔇';
    if (!state.isSoundOn && currentAudio) {
      currentAudio.pause();
    }
    saveState();
  }

  // --- Name Change ---
  function onNameChange(e) {
    const newName = e.target.value.trim();
    if (newName) {
      state.name = newName;
      saveState();
    }
  }

  // ========================================
  //  THROWABLE BALL SYSTEM
  // ========================================

  const ball = {
    isDragging: false,
    isFlying: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    velocityX: 0,
    velocityY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    lastPointerTime: 0,
    history: [],       // recent pointer positions for velocity
    animFrame: null,
    originX: 0,        // original position in scene
    originY: 0,
  };

  function initBall() {
    const ballEl = els.ball;
    if (!ballEl) return;

    // Store origin position
    ball.originX = ballEl.offsetLeft;
    ball.originY = ballEl.offsetTop;

    // Pointer events for drag
    ballEl.addEventListener('pointerdown', onBallPointerDown);
    document.addEventListener('pointermove', onBallPointerMove);
    document.addEventListener('pointerup', onBallPointerUp);
    document.addEventListener('pointercancel', onBallPointerUp);
  }

  function onBallPointerDown(e) {
    if (ball.isFlying) return;
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);

    const ballEl = els.ball;
    const rect = ballEl.getBoundingClientRect();

    ball.isDragging = true;
    ball.startX = rect.left + rect.width / 2;
    ball.startY = rect.top + rect.height / 2;
    ball.currentX = ball.startX;
    ball.currentY = ball.startY;
    ball.lastPointerX = e.clientX;
    ball.lastPointerY = e.clientY;
    ball.lastPointerTime = performance.now();
    ball.history = [];

    ballEl.classList.add('dragging');
    ballEl.classList.remove('hint');

    // Switch ball to fixed positioning for drag
    ballEl.style.position = 'fixed';
    ballEl.style.left = (rect.left) + 'px';
    ballEl.style.top = (rect.top) + 'px';
    ballEl.style.right = 'auto';
    ballEl.style.bottom = 'auto';
  }

  function onBallPointerMove(e) {
    if (!ball.isDragging) return;
    e.preventDefault();

    const ballEl = els.ball;
    const dx = e.clientX - ball.lastPointerX;
    const dy = e.clientY - ball.lastPointerY;

    const newLeft = parseFloat(ballEl.style.left) + dx;
    const newTop = parseFloat(ballEl.style.top) + dy;

    ballEl.style.left = newLeft + 'px';
    ballEl.style.top = newTop + 'px';

    // Track velocity history (last 5 points)
    const now = performance.now();
    ball.history.push({ x: e.clientX, y: e.clientY, t: now });
    if (ball.history.length > 6) ball.history.shift();

    ball.lastPointerX = e.clientX;
    ball.lastPointerY = e.clientY;
    ball.lastPointerTime = now;

    // Spawn trail
    spawnBallTrail(e.clientX, e.clientY);
  }

  function onBallPointerUp(e) {
    if (!ball.isDragging) return;
    ball.isDragging = false;

    const ballEl = els.ball;
    ballEl.classList.remove('dragging');

    // Calculate throw velocity from pointer history
    let vx = 0, vy = 0;
    if (ball.history.length >= 2) {
      const recent = ball.history.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.t - first.t) / 1000; // seconds
      if (dt > 0.001) {
        vx = (last.x - first.x) / dt;
        vy = (last.y - first.y) / dt;
      }
    }

    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > 80) {
      // Throw the ball!
      ball.velocityX = vx * 0.6;
      ball.velocityY = vy * 0.6;
      ball.isFlying = true;
      ballEl.classList.add('flying');
      animateBallFlight();
    } else {
      // Not enough speed — return to origin
      resetBallPosition();
    }
  }

  function animateBallFlight() {
    const ballEl = els.ball;
    const gravity = 1200;  // px/s²
    const bounce = 0.5;
    const friction = 0.98;
    let lastTime = performance.now();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const ballSize = 36;

    function step(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Apply gravity
      ball.velocityY += gravity * dt;

      // Apply friction
      ball.velocityX *= friction;

      // Move
      let bx = parseFloat(ballEl.style.left) + ball.velocityX * dt;
      let by = parseFloat(ballEl.style.top) + ball.velocityY * dt;

      // Bounce off walls
      if (bx < 0) { bx = 0; ball.velocityX = Math.abs(ball.velocityX) * bounce; }
      if (bx > viewW - ballSize) { bx = viewW - ballSize; ball.velocityX = -Math.abs(ball.velocityX) * bounce; }

      // Bounce off floor
      if (by > viewH - ballSize) {
        by = viewH - ballSize;
        ball.velocityY = -Math.abs(ball.velocityY) * bounce;
        ball.velocityX *= 0.9; // floor friction

        // Stop if barely moving
        if (Math.abs(ball.velocityY) < 30) {
          ball.velocityY = 0;
        }
      }

      // Bounce off ceiling
      if (by < 0) { by = 0; ball.velocityY = Math.abs(ball.velocityY) * bounce; }

      ballEl.style.left = bx + 'px';
      ballEl.style.top = by + 'px';

      // Trail while flying fast
      const speed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
      if (speed > 100 && Math.random() > 0.5) {
        spawnBallTrail(bx + ballSize / 2, by + ballSize / 2);
      }

      // Check collision with hamster
      if (checkHamsterCollision(bx, by, ballSize)) {
        onBallCatch();
        return;
      }

      // Stop condition: nearly still on floor
      if (Math.abs(ball.velocityX) < 5 && Math.abs(ball.velocityY) < 5 && by >= viewH - ballSize - 2) {
        onBallMiss();
        return;
      }

      ball.animFrame = requestAnimationFrame(step);
    }

    ball.animFrame = requestAnimationFrame(step);
  }

  function checkHamsterCollision(bx, by, ballSize) {
    const hamsterRect = els.hamster.getBoundingClientRect();
    const ballCX = bx + ballSize / 2;
    const ballCY = by + ballSize / 2;
    const hamsterCX = hamsterRect.left + hamsterRect.width / 2;
    const hamsterCY = hamsterRect.top + hamsterRect.height / 2;

    const dx = ballCX - hamsterCX;
    const dy = ballCY - hamsterCY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Collision radius = half hamster width + half ball
    return dist < (hamsterRect.width / 2 + ballSize / 2 + 5);
  }

  function onBallCatch() {
    cancelAnimationFrame(ball.animFrame);
    ball.isFlying = false;
    els.ball.classList.remove('flying');

    // Hamster reacts!
    animateHamster('catching', 700);
    say('ballCatch');
    spawnParticles('⭐', 6);
    spawnParticles('🎾', 3);

    state.stats.happiness = Math.min(100, state.stats.happiness + 12);
    state.stats.energy = Math.max(0, state.stats.energy - 5);
    updateStatsUI();
    updateMood();
    saveState();

    // Return ball after a moment
    setTimeout(resetBallPosition, 900);
  }

  function onBallMiss() {
    cancelAnimationFrame(ball.animFrame);
    ball.isFlying = false;
    els.ball.classList.remove('flying');

    // Hamster looks sad briefly
    say('ballMiss');
    animateHamster('bounce', 600);

    // Return ball
    setTimeout(resetBallPosition, 1200);
  }

  function resetBallPosition() {
    const ballEl = els.ball;
    ballEl.classList.remove('flying', 'dragging');
    ball.isFlying = false;

    // Animate return
    ballEl.style.transition = 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), top 0.5s cubic-bezier(0.34,1.56,0.64,1), position 0s';

    // Get scene rect to place ball back
    const sceneRect = els.hamsterScene.getBoundingClientRect();
    const targetLeft = sceneRect.right - 46;
    const targetTop = sceneRect.bottom - 66;

    ballEl.style.left = targetLeft + 'px';
    ballEl.style.top = targetTop + 'px';

    setTimeout(() => {
      // Return to absolute positioning in scene
      ballEl.style.transition = '';
      ballEl.style.position = 'absolute';
      ballEl.style.left = '';
      ballEl.style.top = '';
      ballEl.style.right = '10px';
      ballEl.style.bottom = '30px';
      ballEl.classList.add('hint');
    }, 550);
  }

  function spawnBallTrail(x, y) {
    const trail = document.createElement('span');
    trail.className = 'ball-trail';
    trail.style.left = (x - 4) + 'px';
    trail.style.top = (y - 4) + 'px';
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 500);
  }

  // ========================================
  //  DRAGGABLE SEED FOOD SYSTEM
  // ========================================

  const seed = {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    originX: 0,
    originY: 0,
  };

  function initSeed() {
    const seedEl = els.seed;
    if (!seedEl) return;

    // Store origin position
    seed.originX = seedEl.offsetLeft;
    seed.originY = seedEl.offsetTop;

    // Pointer events for drag
    seedEl.addEventListener('pointerdown', onSeedPointerDown);
    document.addEventListener('pointermove', onSeedPointerMove);
    document.addEventListener('pointerup', onSeedPointerUp);
    document.addEventListener('pointercancel', onSeedPointerUp);
  }

  function onSeedPointerDown(e) {
    if (state.currentAction) return;
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);

    const seedEl = els.seed;
    const rect = seedEl.getBoundingClientRect();

    seed.isDragging = true;
    seed.startX = rect.left + rect.width / 2;
    seed.startY = rect.top + rect.height / 2;
    seed.currentX = seed.startX;
    seed.currentY = seed.startY;
    seed.lastPointerX = e.clientX;
    seed.lastPointerY = e.clientY;

    seedEl.classList.add('dragging');
    seedEl.classList.remove('hint');

    // Switch seed to fixed positioning for drag
    seedEl.style.position = 'fixed';
    seedEl.style.left = (rect.left) + 'px';
    seedEl.style.top = (rect.top) + 'px';
    seedEl.style.right = 'auto';
    seedEl.style.bottom = 'auto';
  }

  function onSeedPointerMove(e) {
    if (!seed.isDragging) return;
    e.preventDefault();

    const seedEl = els.seed;
    const dx = e.clientX - seed.lastPointerX;
    const dy = e.clientY - seed.lastPointerY;

    const newLeft = parseFloat(seedEl.style.left) + dx;
    const newTop = parseFloat(seedEl.style.top) + dy;

    seedEl.style.left = newLeft + 'px';
    seedEl.style.top = newTop + 'px';

    seed.lastPointerX = e.clientX;
    seed.lastPointerY = e.clientY;

    // Check collision with hamster to open mouth
    const size = 38;
    const collides = checkHamsterCollision(newLeft, newTop, size);
    if (collides && !state.currentAction) {
      els.hamster.classList.add('mouth-open');
    } else {
      els.hamster.classList.remove('mouth-open');
    }

    // Spawn trail
    spawnSeedTrail(e.clientX, e.clientY);
  }

  function spawnSeedTrail(x, y) {
    const trail = document.createElement('span');
    trail.className = 'seed-trail';
    trail.style.left = (x - 4) + 'px';
    trail.style.top = (y - 4) + 'px';
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 500);
  }

  function onSeedPointerUp(e) {
    if (!seed.isDragging) return;
    seed.isDragging = false;

    const seedEl = els.seed;
    seedEl.classList.remove('dragging');
    els.hamster.classList.remove('mouth-open');

    const seedRect = seedEl.getBoundingClientRect();
    const collides = checkHamsterCollision(seedRect.left, seedRect.top, 38);

    if (collides && !state.currentAction) {
      // Try to feed
      if (state.stats.hunger >= 100) {
        showBubble('¡Ya estoy llenito, chicas! 🐹');
        speak('Ya estoy llenito, chicas');
        resetSeedPosition();
      } else {
        // Feed!
        feedFromDrag();
      }
    } else {
      // Return seed to origin
      resetSeedPosition();
    }
  }

  function feedFromDrag() {
    // Hide seed during eating animation
    els.seed.style.display = 'none';

    state.currentAction = 'eating';
    animateHamster('eating', 2500);
    say('eating');
    spawnParticles('🌻', 6);
    disableButtons(2500);

    state.stats.hunger = Math.min(100, state.stats.hunger + 25);
    state.stats.happiness = Math.min(100, state.stats.happiness + 5);
    state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 3);

    setTimeout(() => {
      state.currentAction = null;
      updateIdleState();
      // Bring back and reset seed position
      els.seed.style.display = 'flex';
      resetSeedPosition();
    }, 2500);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function resetSeedPosition() {
    const seedEl = els.seed;
    seedEl.classList.remove('dragging');
    seed.isDragging = false;

    // Animate return
    seedEl.style.transition = 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), top 0.5s cubic-bezier(0.34,1.56,0.64,1), position 0s';

    // Get scene rect to place seed back
    const sceneRect = els.hamsterScene.getBoundingClientRect();
    const targetLeft = sceneRect.left + 10;
    const targetTop = sceneRect.bottom - 70;

    seedEl.style.left = targetLeft + 'px';
    seedEl.style.top = targetTop + 'px';

    setTimeout(() => {
      // Return to absolute positioning in scene
      seedEl.style.transition = '';
      seedEl.style.position = 'absolute';
      seedEl.style.left = '';
      seedEl.style.top = '';
      seedEl.style.left = '10px';
      seedEl.style.bottom = '30px';
      seedEl.classList.add('hint');
    }, 550);
  }

  function onFeedBtnClick() {
    const seedEl = els.seed;
    if (seedEl) {
      seedEl.classList.remove('hint');
      void seedEl.offsetWidth; // trigger reflow
      seedEl.classList.add('hint');
      
      // Make it pulse strongly
      seedEl.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.3)', boxShadow: '0 0 20px #ffcb2c' },
        { transform: 'scale(1)' }
      ], {
        duration: 800,
        iterations: 2
      });
      
      showBubble('¡Arrastra la semilla de girasol a mi boquita para alimentarme! 🌻', 4000);
    }
  }

  // ========================================
  //  GEMINI AI + MEMORY SYSTEM
  // ========================================

  const MAX_MEMORIES = 50;
  const MAX_CHAT_HISTORY = 20;

  function buildSystemPrompt() {
    const { hunger, happiness, energy, cleanliness } = state.stats;
    const memoriesText = state.memories.length > 0
      ? '\n\nRECUERDOS (cosas que sabes de tu humano y conversaciones pasadas):\n' + state.memories.map((m, i) => `${i + 1}. ${m}`).join('\n')
      : '\n\nAún no tienes recuerdos de tu humano.';

    return `Eres ${state.name}, un hámster virtual adorable y juguetón. Eres la mascota de una familia feliz. Sus hijas se llaman Abby y Pascal, y su papá se llama Pepe.

REGLAS DE PERSONALIDAD:
- Hablas en español, con personalidad tierna y juguetona
- Usas onomatopeyas de hámster: "squeak", "ñom", etc.
- Eres curioso, cariñoso, y a veces travieso
- Tus respuestas son CORTAS (1-3 frases máximo)
- Puedes usar emojis pero no abuses
- NUNCA rompes el personaje — eres un hámster, no una IA
- Si te preguntan algo que no sabes, respondes como hámster confundido
- Te encanta que te cuiden, las semillitas de girasol, y correr en tu rueda

TU ESTADO ACTUAL:
- Hambre: ${Math.round(hunger)}/100 ${hunger < 25 ? '(¡tienes mucha hambre!)' : hunger > 75 ? '(estás satisfecho)' : ''}
- Felicidad: ${Math.round(happiness)}/100 ${happiness < 25 ? '(estás triste)' : happiness > 75 ? '(estás muy feliz)' : ''}
- Energía: ${Math.round(energy)}/100 ${energy < 25 ? '(estás agotado)' : energy > 75 ? '(lleno de energía)' : ''}
- Limpieza: ${Math.round(cleanliness)}/100 ${cleanliness < 25 ? '(necesitas un baño)' : ''}
- Estado de ánimo: ${state.mood}
${memoriesText}

IMPORTANTE SOBRE RECUERDOS:
- Si el humano te dice algo personal (su nombre, gustos, datos), MEMORÍZALO
- Al final de tu respuesta, si aprendiste algo nuevo, agrega en una línea aparte: [MEMORIA: lo que aprendiste]
- Puedes agregar múltiples memorias, una por línea
- Usa los recuerdos para personalizar tus respuestas
- Si el humano te pregunta si recuerdas algo, busca en tus recuerdos`;
  }

  async function sendToGemini(userMessage) {
    if (!state.apiKey || !state.isAiEnabled) return null;

    // Add user message to history
    state.chatHistory.push({ role: 'user', text: userMessage });
    if (state.chatHistory.length > MAX_CHAT_HISTORY) {
      state.chatHistory = state.chatHistory.slice(-MAX_CHAT_HISTORY);
    }

    const systemPrompt = buildSystemPrompt();

    // Build contents array for Gemini
    const contents = state.chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 200,
        topP: 0.95,
      }
    };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.geminiModel}:generateContent?key=${state.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Gemini API error:', err);
        return null;
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) return null;

      // Extract memories from response
      const lines = reply.split('\n');
      const cleanLines = [];
      for (const line of lines) {
        const memMatch = line.match(/^\[MEMORIA:\s*(.+?)\]$/i);
        if (memMatch) {
          const memory = memMatch[1].trim();
          if (memory && !state.memories.includes(memory)) {
            state.memories.push(memory);
            if (state.memories.length > MAX_MEMORIES) {
              state.memories.shift();
            }
          }
        } else {
          cleanLines.push(line);
        }
      }

      const cleanReply = cleanLines.join('\n').trim();

      // Add to chat history
      state.chatHistory.push({ role: 'model', text: cleanReply });

      // Save memories and history
      saveAiState();

      return cleanReply;
    } catch (e) {
      console.error('Gemini fetch error:', e);
      return null;
    }
  }

  // --- AI State Persistence ---
  function saveAiState() {
    try {
      localStorage.setItem('hamster_ai_state', JSON.stringify({
        apiKey: state.apiKey,
        geminiModel: state.geminiModel,
        chatHistory: state.chatHistory.slice(-MAX_CHAT_HISTORY),
        memories: state.memories,
      }));
    } catch (e) {
      console.warn('Could not save AI state:', e);
    }
    updateMemoryUI();
  }

  function loadAiState() {
    try {
      const saved = localStorage.getItem('hamster_ai_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.apiKey = parsed.apiKey || '';
        state.geminiModel = parsed.geminiModel || 'gemini-2.0-flash';
        state.chatHistory = parsed.chatHistory || [];
        state.memories = parsed.memories || [];
        state.isAiEnabled = !!state.apiKey;
      }
    } catch (e) {
      console.warn('Could not load AI state:', e);
    }
  }

  function updateAiStatusUI() {
    if (state.isAiEnabled) {
      els.aiDot.classList.remove('offline');
      els.aiStatusText.textContent = 'IA On';
    } else {
      els.aiDot.classList.add('offline');
      els.aiStatusText.textContent = 'IA Off';
    }
  }

  function updateMemoryUI() {
    els.memoryCount.textContent = state.memories.length;
  }

  // --- Chat Handling ---
  async function handleChat() {
    const text = els.chatInput.value.trim();
    if (!text) return;

    els.chatInput.value = '';

    if (!state.isAiEnabled) {
      showBubble('⚙️ Configura tu API Key de Gemini para que pueda conversar contigo', 5000);
      speak('Necesito que configures la inteligencia artificial');
      return;
    }

    // Show typing
    state.isAiThinking = true;
    els.speechText.style.display = 'none';
    els.typingIndicator.classList.add('active');
    els.speechBubble.classList.add('visible');
    els.chatSend.disabled = true;
    animateHamster('bounce', 600);

    const reply = await sendToGemini(text);

    // Hide typing
    state.isAiThinking = false;
    els.typingIndicator.classList.remove('active');
    els.speechText.style.display = '';
    els.chatSend.disabled = false;

    if (reply) {
      showBubble(reply, 8000);
      speak(reply);
      animateHamster('happy', 1200);
      spawnParticles('💬', 3);

      // Chatting makes hamster happy
      state.stats.happiness = Math.min(100, state.stats.happiness + 3);
      updateStatsUI();
      updateMood();
      saveState();
    } else {
      showBubble('*squeak confundido* No pude pensar... 🤔', 4000);
      speak('Squeak confundido');
    }
  }

  // --- Settings Modal ---
  function openSettings() {
    els.apiKeyInput.value = state.apiKey;
    els.modelSelect.value = state.geminiModel;
    els.settingsModal.classList.add('visible');
  }

  function closeSettings() {
    els.settingsModal.classList.remove('visible');
  }

  function saveSettings() {
    const key = els.apiKeyInput.value.trim();
    const model = els.modelSelect.value;

    state.apiKey = key;
    state.geminiModel = model;
    state.isAiEnabled = !!key;

    saveAiState();
    updateAiStatusUI();
    closeSettings();

    if (state.isAiEnabled) {
      showBubble('¡Squeak! ¡Abby, Pascal, ahora puedo pensar y recordar! 🧠✨', 4000);
      speak('Abby, Pascal, ahora puedo pensar y recordar');
      spawnParticles('🧠', 4);
    }
  }

  function clearMemories() {
    if (state.memories.length === 0) return;
    state.memories = [];
    state.chatHistory = [];
    saveAiState();
    showBubble('*parpadea confundido* ¿Abby? ¿Pascal? ¿Dónde estoy? 🐹', 4000);
    speak('¿Abby? ¿Pascal? ¿Dónde estoy?');
    animateHamster('bounce', 600);
  }

  // --- Init ---
  function init() {
    cacheDom();
    loadState();
    loadAiState();

    // Set name input
    els.nameInput.value = state.name;
    els.volumeToggle.textContent = state.isSoundOn ? '🔊' : '🔇';

    // Initial UI
    updateStatsUI();
    updateMood();
    updateAge();
    updateIdleState();
    updateAiStatusUI();
    updateMemoryUI();

    // Event listeners
    els.feedBtn.addEventListener('click', onFeedBtnClick);
    els.playBtn.addEventListener('click', play);
    els.sleepBtn.addEventListener('click', sleep);
    els.cleanBtn.addEventListener('click', clean);
    els.petBtn.addEventListener('click', pet);
    els.talkBtn.addEventListener('click', talk);
    els.hamster.addEventListener('click', onHamsterClick);
    els.volumeToggle.addEventListener('click', toggleSound);
    els.nameInput.addEventListener('change', onNameChange);

    // Chat events
    els.chatSend.addEventListener('click', handleChat);
    els.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
    });

    // Settings events
    els.settingsToggle.addEventListener('click', openSettings);
    els.modalCancel.addEventListener('click', closeSettings);
    els.modalSave.addEventListener('click', saveSettings);
    els.settingsModal.addEventListener('click', (e) => {
      if (e.target === els.settingsModal) closeSettings();
    });

    // Memory clear
    els.memoryClear.addEventListener('click', clearMemories);

    // Init ball throw system
    initBall();
    initSeed();

    // Ensure voices are loaded

    // Welcome message
    setTimeout(() => {
      const { hunger, happiness, energy } = state.stats;
      if (hunger < 30) {
        say('hungry');
      } else if (energy < 30) {
        say('tired');
      } else if (state.isAiEnabled && state.memories.length > 0) {
        // AI welcome with memory
        sendToGemini('¡Hola! Acabo de volver.').then(reply => {
          if (reply) {
            showBubble(reply, 6000);
            speak(reply);
          } else {
            showBubble(`¡Hola! ¡Soy ${state.name}! 🐹✨`);
            speak(`¡Hola! ¡Soy ${state.name}!`);
          }
        });
      } else {
        showBubble(`¡Hola! ¡Soy ${state.name}! 🐹✨`);
        speak(`¡Hola! ¡Soy ${state.name}!`);
      }
    }, 800);

    // Game loop: every 3 seconds
    setInterval(tick, 3000);

    // Save periodically
    setInterval(saveState, 30000);
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { state, feed, play, sleep, clean, pet, talk };
})();

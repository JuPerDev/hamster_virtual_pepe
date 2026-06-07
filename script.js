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
    // Walking
    positionX: 0,
    facingDirection: 1,
    isWalking: false,
    // Wardrobe
    hat: '',
  };

  // --- Load saved state ---
  function loadState() {
    try {
      const saved = localStorage.getItem('hamster_pet_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state.stats, parsed.stats);
        state.name = parsed.name || 'PEPE';
        state.isSoundOn = parsed.isSoundOn !== undefined ? parsed.isSoundOn : true;
        state.birthTime = parsed.birthTime || Date.now();
        state.hat = parsed.hat || '';

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
        hat: state.hat,
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
      wardrobeBtn: document.getElementById('btn-wardrobe'),
      // Ball
      ball: document.getElementById('throwable-ball'),
      hamsterScene: document.querySelector('.hamster-scene'),
      // Foods
      foods: document.querySelectorAll('.draggable-food'),
      // Wardrobe
      hamsterHat: document.getElementById('hamster-hat'),
      wardrobeModal: document.getElementById('wardrobe-modal'),
      wardrobeCloseBtn: document.getElementById('btn-wardrobe-close'),
      hatOptions: document.querySelectorAll('.hat-option'),
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
    if (className !== 'idle' && className !== 'walking') {
      stopWalking();
    }

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

  // --- Hamster Walking Logic ---
  function updateHamsterTransform() {
    if (!els.hamster) return;
    els.hamster.style.transform = `translate3d(${state.positionX}px, 0, 0)`;
  }

  function startWalking() {
    if (state.currentAction || state.isSpeaking || state.isAiThinking) return;

    const targetX = (Math.random() * 36) - 18;

    state.positionX = targetX;
    state.isWalking = true;

    if (els.hamster) {
      els.hamster.classList.remove('idle');
      els.hamster.classList.add('walking');
      updateHamsterTransform();

      clearTimeout(state._walkTimer);
      state._walkTimer = setTimeout(() => {
        state.isWalking = false;
        if (els.hamster) {
          els.hamster.classList.remove('walking');
          updateIdleState();
        }
      }, 900);
    }
  }

  function stopWalking() {
    state.isWalking = false;
    state.positionX = 0;
    state.facingDirection = 1;
    clearTimeout(state._walkTimer);
    if (els.hamster) {
      els.hamster.classList.remove('walking');
      updateHamsterTransform();
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

    stopWalking();

    // Show the ball!
    const ballEl = els.ball;
    if (ballEl) {
      ballEl.style.display = 'block';
      ballEl.style.opacity = '0';
      ballEl.classList.remove('hint');
      
      // Animate entry (fade-in & bounce up)
      ballEl.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      void ballEl.offsetWidth; // force reflow
      ballEl.style.opacity = '1';
      ballEl.classList.add('hint');
      
      // Clear any previous hide timer
      clearTimeout(state._ballHideTimer);
      
      // Auto-hide if they don't play in 10 seconds
      state._ballHideTimer = setTimeout(hideBall, 10000);
    }

    showBubble('¡Lánzame la pelota, chicas! 🎾', 4000);
    animateHamster('happy', 1500);
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

    // Random horizontal walk when idle, not speaking, and not thinking
    if (Math.random() < 0.08 && !state.currentAction && !state.isSpeaking && !state.isAiThinking && state.stats.energy >= 15) {
      startWalking();
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
    offsetX: 0,
    offsetY: 0,
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
    
    // Cancel the ball hiding countdown when user drags it
    clearTimeout(state._ballHideTimer);

    const ballEl = els.ball;
    
    // Get actual local coordinates before removing bottom/right
    const startLeft = ballEl.offsetLeft;
    const startTop = ballEl.offsetTop;

    ball.isDragging = true;
    ball.lastPointerX = e.clientX;
    ball.lastPointerY = e.clientY;
    ball.lastPointerTime = performance.now();
    ball.history = [];

    ballEl.classList.add('dragging');
    ballEl.classList.remove('hint');

    ballEl.style.right = 'auto';
    ballEl.style.bottom = 'auto';
    ballEl.style.left = startLeft + 'px';
    ballEl.style.top = startTop + 'px';
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

    ball.lastPointerX = e.clientX;
    ball.lastPointerY = e.clientY;

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
      // Not enough speed — return to origin and auto-hide
      resetBallPosition();
      state._ballHideTimer = setTimeout(hideBall, 4000);
    }
  }

  function animateBallFlight() {
    const ballEl = els.ball;
    const ballSize = 30;
    const sceneRect = els.hamsterScene.getBoundingClientRect();
    
    const minLeft = -sceneRect.left;
    const maxLeft = window.innerWidth - sceneRect.left - ballSize;
    const maxTop = window.innerHeight - sceneRect.top - ballSize;

    let bx = parseFloat(ballEl.style.left);
    let by = parseFloat(ballEl.style.top);

    function step() {
      // Physics...
      bx += ball.velocityX * 0.016;
      by += ball.velocityY * 0.016;
      ball.velocityY += 1.5; // Gravity

      // Wall bounce
      if (bx <= minLeft) { bx = minLeft; ball.velocityX *= -0.7; }
      if (bx >= maxLeft) { bx = maxLeft; ball.velocityX *= -0.7; }

      // Floor bounce
      if (by >= maxTop) {
        by = maxTop;
        ball.velocityY *= -0.7;
        ball.velocityX *= 0.9;
      }

      ballEl.style.left = bx + 'px';
      ballEl.style.top = by + 'px';

      if (checkHamsterCollision(bx, by, ballSize)) {
        onBallCatch();
        return;
      }

      // Stop condition: nearly still on floor
      if (Math.abs(ball.velocityX) < 5 && Math.abs(ball.velocityY) < 5 && by >= maxTop - 2) {
        onBallMiss();
        return;
      }

      ball.animFrame = requestAnimationFrame(step);
    }

    ball.animFrame = requestAnimationFrame(step);
  }

  function checkHamsterCollision(bx, by, ballSize) {
    const hamsterRect = els.hamster.getBoundingClientRect();
    const sceneRect = els.hamsterScene.getBoundingClientRect();
    
    const ballCX = sceneRect.left + bx + ballSize / 2;
    const ballCY = sceneRect.top + by + ballSize / 2;
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

    // Return ball after a moment and auto-hide
    setTimeout(() => {
      resetBallPosition();
      state._ballHideTimer = setTimeout(hideBall, 3000);
    }, 900);
  }

  function onBallMiss() {
    cancelAnimationFrame(ball.animFrame);
    ball.isFlying = false;
    els.ball.classList.remove('flying');

    // Hamster looks sad briefly
    say('ballMiss');
    animateHamster('bounce', 600);

    // Return ball and auto-hide
    setTimeout(() => {
      resetBallPosition();
      state._ballHideTimer = setTimeout(hideBall, 3000);
    }, 1200);
  }

  function resetBallPosition() {
    const ballEl = els.ball;
    if (!ballEl) return;
    
    ballEl.classList.remove('flying', 'dragging');
    ball.isFlying = false;

    // Animate return
    ballEl.style.transition = 'left 0.4s ease, top 0.4s ease';
    
    ballEl.style.left = '230px';
    ballEl.style.top = '210px';

    setTimeout(() => {
      ballEl.style.transition = '';
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
  //  DRAGGABLE FOODS SYSTEM
  // ========================================

  let activeDraggedFood = null;
  const foodDragState = {
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    origins: {}
  };

  function initFoods() {
    const foodEls = document.querySelectorAll('.draggable-food');
    foodEls.forEach(el => {
      foodDragState.origins[el.id] = {
        left: el.offsetLeft,
        top: el.offsetTop
      };

      el.addEventListener('pointerdown', onFoodPointerDown);
    });

    document.addEventListener('pointermove', onFoodPointerMove);
    document.addEventListener('pointerup', onFoodPointerUp);
    document.addEventListener('pointercancel', onFoodPointerUp);
  }

  function onFoodPointerDown(e) {
    if (state.currentAction) return;
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);

    activeDraggedFood = e.currentTarget;

    const startLeft = activeDraggedFood.offsetLeft;
    const startTop = activeDraggedFood.offsetTop;

    foodDragState.isDragging = true;
    foodDragState.lastPointerX = e.clientX;
    foodDragState.lastPointerY = e.clientY;

    activeDraggedFood.classList.add('dragging');
    activeDraggedFood.classList.remove('hint');

    activeDraggedFood.style.right = 'auto';
    activeDraggedFood.style.bottom = 'auto';
    activeDraggedFood.style.left = startLeft + 'px';
    activeDraggedFood.style.top = startTop + 'px';

    // Cancel the foods hiding countdown when user drags one
    clearTimeout(state._foodHideTimer);
  }

  // Check collision with hamster to open mouth
  function onFoodPointerMove(e) {
    if (!foodDragState.isDragging || !activeDraggedFood) return;
    e.preventDefault();

    const dx = e.clientX - foodDragState.lastPointerX;
    const dy = e.clientY - foodDragState.lastPointerY;

    const newLeft = parseFloat(activeDraggedFood.style.left) + dx;
    const newTop = parseFloat(activeDraggedFood.style.top) + dy;

    activeDraggedFood.style.left = newLeft + 'px';
    activeDraggedFood.style.top = newTop + 'px';

    foodDragState.lastPointerX = e.clientX;
    foodDragState.lastPointerY = e.clientY;

    // Check collision with hamster to open mouth
    const size = 36;
    const collides = checkHamsterCollision(newLeft, newTop, size);
    if (collides && !state.currentAction) {
      els.hamster.classList.add('mouth-open');
    } else {
      els.hamster.classList.remove('mouth-open');
    }

    // Spawn trail
    spawnFoodTrail(e.clientX, e.clientY, activeDraggedFood.dataset.food);
  }

  function spawnFoodTrail(x, y, foodType) {
    const trail = document.createElement('span');
    trail.className = 'food-trail';
    
    let color = 'rgba(255, 203, 44, 0.5)';
    if (foodType === 'carrot') color = 'rgba(255, 133, 44, 0.5)';
    else if (foodType === 'cheese') color = 'rgba(255, 217, 59, 0.5)';

    trail.style.backgroundColor = color;
    trail.style.left = (x - 4) + 'px';
    trail.style.top = (y - 4) + 'px';
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 500);
  }

  function onFoodPointerUp(e) {
    if (!foodDragState.isDragging || !activeDraggedFood) return;
    foodDragState.isDragging = false;

    const foodEl = activeDraggedFood;
    activeDraggedFood = null;

    foodEl.classList.remove('dragging');
    els.hamster.classList.remove('mouth-open');

    const relLeft = parseFloat(foodEl.style.left);
    const relTop = parseFloat(foodEl.style.top);
    const collides = checkHamsterCollision(relLeft, relTop, 36);

    if (collides && !state.currentAction) {
      if (state.stats.hunger >= 100) {
        showBubble('¡Ya estoy llenito, chicas! 🐹');
        speak('Ya estoy llenito, chicas');
        resetFoodPosition(foodEl);
        // Wait 3 seconds and hide all
        state._foodHideTimer = setTimeout(hideFoods, 3000);
      } else {
        feedFromDrag(foodEl.dataset.food, foodEl);
      }
    } else {
      resetFoodPosition(foodEl);
      // Auto-hide in 4 seconds if dropped without feeding
      state._foodHideTimer = setTimeout(hideFoods, 4000);
    }
  }

  function feedFromDrag(foodType, foodEl) {
    foodEl.style.display = 'none';

    state.currentAction = 'eating';
    animateHamster('eating', 2500);
    
    let emoji = '🌻';
    let hungerGain = 25;
    let happinessGain = 5;
    let cleanlinessLoss = 3;

    if (foodType === 'carrot') {
      emoji = '🥕';
      hungerGain = 20;
      happinessGain = 8;
      cleanlinessLoss = 1;
    } else if (foodType === 'cheese') {
      emoji = '🧀';
      hungerGain = 30;
      happinessGain = 12;
      cleanlinessLoss = 6;
    }

    say('eating');
    spawnParticles(emoji, 6);
    disableButtons(2500);

    state.stats.hunger = Math.min(100, state.stats.hunger + hungerGain);
    state.stats.happiness = Math.min(100, state.stats.happiness + happinessGain);
    state.stats.cleanliness = Math.max(0, state.stats.cleanliness - cleanlinessLoss);

    setTimeout(() => {
      state.currentAction = null;
      updateIdleState();
      foodEl.style.display = 'flex';
      resetFoodPosition(foodEl);
      // Wait 3 seconds, then hide all foods
      state._foodHideTimer = setTimeout(hideFoods, 3000);
    }, 2500);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function resetFoodPosition(foodEl) {
    foodEl.classList.remove('dragging');
    
    foodEl.style.transition = 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), top 0.5s cubic-bezier(0.34,1.56,0.64,1), position 0s';

    let offsetLeft = 50;
    if (foodEl.dataset.food === 'carrot') offsetLeft = 120;
    else if (foodEl.dataset.food === 'cheese') offsetLeft = 190;

    const targetTop = 210;

    foodEl.style.left = offsetLeft + 'px';
    foodEl.style.top = targetTop + 'px';

    setTimeout(() => {
      foodEl.style.transition = '';
      foodEl.style.left = offsetLeft + 'px';
      foodEl.style.top = '';
      foodEl.style.bottom = '30px';
      foodEl.classList.add('hint');
    }, 550);
  }

  function onFeedBtnClick() {
    stopWalking();

    // Clear any previous hide timer
    clearTimeout(state._foodHideTimer);

    const foodEls = document.querySelectorAll('.draggable-food');
    foodEls.forEach((foodEl, idx) => {
      foodEl.style.display = 'flex';
      foodEl.style.opacity = '0';
      foodEl.classList.remove('hint');
      
      // Animate entry (fade-in & bounce up)
      foodEl.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      void foodEl.offsetWidth; // force reflow
      foodEl.style.opacity = '1';
      foodEl.classList.add('hint');

      // Make them pulse sequentially
      foodEl.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.3)', boxShadow: '0 0 20px rgba(255,203,44,0.8)' },
        { transform: 'scale(1)' }
      ], {
        duration: 800,
        delay: idx * 150,
        iterations: 2
      });
    });

    // Auto-hide foods in 10 seconds of inactivity
    state._foodHideTimer = setTimeout(hideFoods, 10000);

    showBubble('¡Arrastra la comida a mi boquita para alimentarme! 🌻🥕🧀', 4000);
  }

  function hideFoods() {
    const foodEls = document.querySelectorAll('.draggable-food');
    foodEls.forEach(foodEl => {
      if (foodEl.style.display !== 'none') {
        foodEl.style.transition = 'opacity 0.5s ease';
        foodEl.style.opacity = '0';
        setTimeout(() => {
          foodEl.style.display = 'none';
        }, 500);
      }
    });
  }

  function hideBall() {
    const ballEl = els.ball;
    if (ballEl && ballEl.style.display !== 'none') {
      ballEl.style.transition = 'opacity 0.5s ease';
      ballEl.style.opacity = '0';
      setTimeout(() => {
        ballEl.style.display = 'none';
      }, 500);
    }
  }

  // ========================================
  //  WARDROBE SYSTEM
  // ========================================

  function openWardrobe() {
    if (state.currentAction) return;
    playSound('select');
    
    // Highlight current hat
    els.hatOptions.forEach(btn => {
      if (btn.dataset.hat === state.hat) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    els.wardrobeModal.classList.add('visible');
  }

  function closeWardrobe() {
    playSound('select');
    els.wardrobeModal.classList.remove('visible');
  }

  function onHatSelect(e) {
    const btn = e.currentTarget;
    const selectedHat = btn.dataset.hat;
    
    state.hat = selectedHat;
    saveState();
    applyHat(selectedHat);
    
    // Update UI
    els.hatOptions.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    // Small animation on hamster
    els.hamsterHat.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => {
      els.hamsterHat.style.transform = 'translateX(-50%)';
    }, 150);

    playSound('select');
  }

  function applyHat(hatEmoji) {
    if (hatEmoji) {
      els.hamsterHat.textContent = hatEmoji;
      els.hamsterHat.style.display = 'block';
    } else {
      els.hamsterHat.textContent = '';
      els.hamsterHat.style.display = 'none';
    }
  }

  function init() {
    cacheDom();
    loadState();

    // Set name input
    els.nameInput.value = state.name;
    els.volumeToggle.textContent = state.isSoundOn ? '🔊' : '🔇';

    // Initial UI
    updateStatsUI();
    updateMood();
    updateAge();
    updateIdleState();

    // Event listeners
    els.feedBtn.addEventListener('click', onFeedBtnClick);
    els.playBtn.addEventListener('click', play);
    els.sleepBtn.addEventListener('click', sleep);
    els.cleanBtn.addEventListener('click', clean);
    els.petBtn.addEventListener('click', pet);
    els.talkBtn.addEventListener('click', talk);
    els.wardrobeBtn.addEventListener('click', openWardrobe);
    els.wardrobeCloseBtn.addEventListener('click', closeWardrobe);
    els.hamster.addEventListener('click', onHamsterClick);
    els.volumeToggle.addEventListener('click', toggleSound);
    els.nameInput.addEventListener('change', onNameChange);

    els.hatOptions.forEach(btn => {
      btn.addEventListener('click', onHatSelect);
    });

    // Apply saved hat
    applyHat(state.hat);

    // Init ball throw system
    initBall();
    initFoods();

    // Ensure voices are loaded

    // Welcome message
    setTimeout(() => {
      const { hunger, happiness, energy } = state.stats;
      if (hunger < 30) {
        say('hungry');
      } else if (energy < 30) {
        say('tired');
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

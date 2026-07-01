/* ========================================
   HAMSTER PET — Game Logic
   ======================================== */

const HamsterPet = (() => {
  // --- State ---
  const state = {
    name: 'PEPE',
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
    // Walking
    positionX: 0,
    facingDirection: 1,
    isWalking: false,
    // Wardrobe
    hat: '',
    achievements: {
      fed: 0,
      played: 0,
      slept: 0,
      cleaned: 0,
      petted: 0,
      wheelRuns: 0,
      dances: 0,
      brushed: 0,
      hatsCollected: 0,
      unlocked: [],
    },
    habitat: { wall: '', floor: '', deco: '' },
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
        state.hatTop = parsed.hatTop || null;
        state.hatLeft = parsed.hatLeft || null;
        state.glasses = parsed.glasses || '';
        state.glassesTop = parsed.glassesTop || null;
        state.glassesLeft = parsed.glassesLeft || null;

        // Migrate glasses position from v1 (220px box) to v2 (90px box):
        // drawing shifted up 65px, so add 65 to saved top.
        if (parsed.cfgVer !== 2 && state.glassesTop) {
          const oldTop = parseFloat(state.glassesTop);
          if (!isNaN(oldTop)) state.glassesTop = (oldTop + 65) + 'px';
        }

        if (parsed.achievements) {
          Object.assign(state.achievements, parsed.achievements);
        }
        if (parsed.habitat) Object.assign(state.habitat, parsed.habitat);

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
        hatTop: state.hatTop,
        hatLeft: state.hatLeft,
        glasses: state.glasses,
        glassesTop: state.glassesTop,
        glassesLeft: state.glassesLeft,
        achievements: state.achievements,
        habitat: state.habitat,
        cfgVer: 2,
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
      foodTray: document.getElementById('food-tray'),
      // Wardrobe
      hamsterHat: document.getElementById('hamster-hat'),
      wardrobeModal: document.getElementById('wardrobe-modal'),
      wardrobeCloseBtn: document.getElementById('btn-wardrobe-close'),
      hatOptions: document.querySelectorAll('.hat-option'),
      // Glasses
      hamsterGlasses: document.getElementById('hamster-glasses'),
      btnGlasses: document.getElementById('btn-glasses'),
      glassesModal: document.getElementById('glasses-modal'),
      btnGlassesClose: document.getElementById('btn-glasses-close'),
      glassesOptions: document.querySelectorAll('.glasses-option'),
      wheelBtn: document.getElementById('btn-wheel'),
      danceBtn: document.getElementById('btn-dance'),
      brushBtn: document.getElementById('btn-brush'),
      yarnBtn: document.getElementById('btn-yarn'),
      habitatBtn: document.getElementById('btn-habitat'),
      habitatModal: document.getElementById('habitat-modal'),
      btnHabitatClose: document.getElementById('btn-habitat-close'),
      habitatOptions: document.querySelectorAll('.habitat-option'),
      habitatWall: document.getElementById('habitat-wall'),
      habitatFloor: document.getElementById('habitat-floor'),
      habitatDeco: document.getElementById('habitat-deco'),
      badgeWall: document.querySelector('.badge-wall'),
    };
  }

  // --- Audio System ---
  let currentAudio = null;
  let tickInterval = null;
  let saveInterval = null;
  let initDone = false;
  const HAMSTER_ACTION_CLASSES = [
    'idle',
    'walking',
    'bounce',
    'happy',
    'eating',
    'sleeping',
    'catching',
    'running',
    'dancing',
    'brushing',
    'curious',
    'sniffing',
    'stretching',
    'tracking-ball',
  ];
  const HAMSTER_MOOD_CLASSES = [
    'mood-happy',
    'mood-normal',
    'mood-sad',
    'mood-hungry',
    'mood-tired',
    'mood-dirty',
    'mood-bad',
  ];

  function setSpeakingVisual(active) {
    if (els.hamster) {
      els.hamster.classList.toggle('speaking', active);
    }
  }

  function playAudio(src) {
    if (!state.isSoundOn) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setSpeakingVisual(false);
    }

    currentAudio = new Audio(src);
    state.isSpeaking = true;
    setSpeakingVisual(true);
    currentAudio.onended = () => {
      state.isSpeaking = false;
      setSpeakingVisual(false);
    };
    currentAudio.onerror = () => {
      state.isSpeaking = false;
      setSpeakingVisual(false);
    };
    
    currentAudio.play().catch(err => {
      console.warn('Failed to play audio:', src, err);
      state.isSpeaking = false;
      setSpeakingVisual(false);
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
    'Chicas, ya estoy limpiecito': 'sounds/inline_clean.mp3'
  };

  function speak(text) {
    const audioSrc = inlineAudioMap[text];
    if (audioSrc) {
      playAudio(audioSrc);
    }
  }

  function say(category) {
    const list = phrases[category] || phrases.idle;
    const index = Math.floor(Math.random() * list.length);
    playPhraseAudio(category, index);
  }

  // --- Particles ---
  function spawnParticles(emoji, count = 5) {
    const scene = els.hamsterScene;
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
  function clearHamsterActionClasses() {
    els.hamster.classList.remove(...HAMSTER_ACTION_CLASSES);
  }

  function animateHamster(className, duration = 800) {
    if (className !== 'idle' && className !== 'walking') {
      stopWalking();
    }

    clearHamsterActionClasses();
    void els.hamster.offsetWidth; // Force reflow
    els.hamster.classList.add(className);

    if (className !== 'sleeping' && className !== 'idle') {
      setTimeout(() => {
        els.hamster.classList.remove(className);
        updateIdleState();
      }, duration);
    }
  }

  function triggerIdleGesture() {
    if (state.currentAction || state.isSpeaking || state.stats.energy < 15) return;

    const gestures = [
      { className: 'curious', duration: 1200 },
      { className: 'sniffing', duration: 1100 },
      { className: 'stretching', duration: 1350 },
    ];
    const gesture = gestures[Math.floor(Math.random() * gestures.length)];
    animateHamster(gesture.className, gesture.duration);
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

    let mood, emoji, moodClass;

    if (state.currentAction === 'sleeping') {
      mood = 'Durmiendo';
      emoji = '😴';
      moodClass = 'mood-tired';
    } else if (hunger < 20) {
      mood = 'Hambriento';
      emoji = '😫';
      moodClass = 'mood-hungry';
    } else if (energy < 20) {
      mood = 'Cansado';
      emoji = '😪';
      moodClass = 'mood-tired';
    } else if (cleanliness < 20) {
      mood = 'Sucio';
      emoji = '🫣';
      moodClass = 'mood-dirty';
    } else if (avg > 75) {
      mood = 'Feliz';
      emoji = '😊';
      moodClass = 'mood-happy';
    } else if (avg > 50) {
      mood = 'Normal';
      emoji = '🙂';
      moodClass = 'mood-normal';
    } else if (avg > 25) {
      mood = 'Triste';
      emoji = '😟';
      moodClass = 'mood-sad';
    } else {
      mood = 'Mal';
      emoji = '😢';
      moodClass = 'mood-bad';
    }

    state.mood = mood;
    els.moodEmoji.textContent = emoji;
    els.moodText.textContent = mood;
    els.hamster.classList.remove(...HAMSTER_MOOD_CLASSES);
    els.hamster.classList.add(moodClass);
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

    const { energy } = state.stats;

    if (energy < 15) {
      sleep();
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
    if (state.currentAction || state.isSpeaking) return;

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

  let audioCtx = null;
  let chewTimer = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playChew() {
    const ctx = getAudioCtx();
    if (!ctx || !state.isSoundOn) return;
    const duration = 0.06 + Math.random() * 0.04;
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(sr * duration), sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600 + Math.random() * 600;
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  function startChewing() {
    stopChewing();
    function next() {
      if (state.currentAction !== 'eating') return;
      playChew();
      chewTimer = setTimeout(next, 120 + Math.random() * 180);
    }
    next();
  }

  function stopChewing() {
    if (chewTimer) { clearTimeout(chewTimer); chewTimer = null; }
  }

  // --- Actions ---
  function disableButtons(ms) {
    const btns = [els.feedBtn, els.playBtn, els.sleepBtn, els.cleanBtn, els.petBtn, els.talkBtn, els.wheelBtn, els.danceBtn, els.brushBtn];
    btns.forEach(b => b.disabled = true);
    setTimeout(() => btns.forEach(b => b.disabled = false), ms);
  }

  function feed() {
    if (state.stats.hunger >= 100) {
      speak('Ya estoy llenito, chicas');
      return;
    }

    state.achievements.fed++;
    state.currentAction = 'eating';
    animateHamster('eating', 2500);
    say('eating');
    startChewing();
    spawnParticles('🌻', 6);
    disableButtons(2500);

    state.stats.hunger = Math.min(100, state.stats.hunger + 25);
    state.stats.happiness = Math.min(100, state.stats.happiness + 5);
    state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 3);

    setTimeout(() => {
      state.currentAction = null;
      stopChewing();
      updateIdleState();
    }, 2500);

    updateStatsUI();
    updateMood();
    saveState();
    checkAchievements();
  }

  function play() {
    if (state.stats.energy < 10) {
      speak('Chicas, estoy muy cansadito');
      return;
    }

    state.achievements.played++;
    stopWalking();

    // Show the ball!
    const ballEl = els.ball;
    if (ballEl) {
      ballEl.style.display = 'block';
      ball.originX = ballEl.offsetLeft;
      ball.originY = ballEl.offsetTop;
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

    say('playing');
    animateHamster('happy', 1500);
    checkAchievements();
  }

  let restInterval = null;

  function wakeUp(silent = false) {
    if (restInterval) {
      clearInterval(restInterval);
      restInterval = null;
    }
    state.currentAction = null;
    els.hamster.classList.remove('sleeping');
    els.zzzContainer.style.display = 'none';
    if (!silent) {
      animateHamster('bounce', 800);
      speak('Abby, Pascal, desperté con energía');
    }
    updateIdleState();
    saveState();
  }

  function handleActionClick(actionFn) {
    return function(e) {
      if (state.currentAction === 'sleeping') {
        wakeUp(true); // silent wakeup
        if (actionFn === sleep) return; // if they clicked sleep, just wake up
      }
      actionFn(e);
    };
  }

  function sleep() {
    if (state.currentAction) return;

    state.currentAction = 'sleeping';
    clearHamsterActionClasses();
    els.hamster.classList.add('sleeping');
    els.zzzContainer.style.display = 'block';
    say('sleeping');

    restInterval = setInterval(() => {
      state.stats.energy = Math.min(100, state.stats.energy + 10);
      state.stats.hunger = Math.max(0, state.stats.hunger - 1);
      updateStatsUI();
      updateMood();
      saveState();

      if (state.stats.energy >= 100) {
        state.achievements.slept++;
        checkAchievements();
        wakeUp();
      }
    }, 1500);
  }

  function clean() {
    if (state.stats.cleanliness >= 100) {
      speak('Chicas, ya estoy limpiecito');
      return;
    }

    state.achievements.cleaned++;
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
    checkAchievements();
  }

  function pet() {
    state.achievements.petted++;
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
    checkAchievements();
  }

  function wheel() {
    if (state.stats.energy < 15) {
      speak('Chicas, estoy muy cansadito');
      return;
    }
    state.currentAction = 'running';
    clearHamsterActionClasses();
    els.hamster.classList.add('running');
    say('playing');
    startChewing();
    spawnParticles('💨', 5);
    disableButtons(3000);

    const runInterval = setInterval(() => {
      state.stats.energy = Math.max(0, state.stats.energy - 4);
      state.stats.happiness = Math.min(100, state.stats.happiness + 3);
      state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 1);
      state.stats.hunger = Math.max(0, state.stats.hunger - 2);
      updateStatsUI();
      updateMood();
      saveState();
    }, 400);

    setTimeout(() => {
      clearInterval(runInterval);
      stopChewing();
      state.currentAction = null;
      els.hamster.classList.remove('running');
      animateHamster('bounce', 600);
      updateIdleState();
      state.achievements.wheelRuns++;
      checkAchievements();
    }, 3000);
  }

  function dance() {
    state.currentAction = 'dancing';
    clearHamsterActionClasses();
    els.hamster.classList.add('dancing');
    say('happy');
    spawnParticles('🎵', 8);
    spawnParticles('🎶', 4);
    disableButtons(2500);

    state.stats.happiness = Math.min(100, state.stats.happiness + 18);
    state.stats.energy = Math.max(0, state.stats.energy - 8);

    setTimeout(() => {
      state.currentAction = null;
      els.hamster.classList.remove('dancing');
      updateIdleState();
      state.achievements.dances++;
      checkAchievements();
    }, 2500);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function brush() {
    if (state.stats.cleanliness >= 100) {
      speak('Chicas, ya estoy limpiecito');
      return;
    }
    state.currentAction = 'brushing';
    clearHamsterActionClasses();
    els.hamster.classList.add('brushing');
    say('clean');
    spawnParticles('✨', 6);
    spawnParticles('💅', 3);
    disableButtons(2000);

    state.stats.cleanliness = Math.min(100, state.stats.cleanliness + 20);
    state.stats.happiness = Math.min(100, state.stats.happiness + 8);

    setTimeout(() => {
      state.currentAction = null;
      els.hamster.classList.remove('brushing');
      updateIdleState();
      state.achievements.brushed++;
      checkAchievements();
    }, 2000);

    updateStatsUI();
    updateMood();
    saveState();
  }

  function playYarn() {
    if (state.stats.energy < 10) {
      speak('Chicas, estoy muy cansadito');
      return;
    }
    stopWalking();
    const yarnEl = document.getElementById('yarn-toy');
    if (!yarnEl) return;
    yarnEl.style.display = 'block';
    yarnEl.style.opacity = '0';
    yarnEl.classList.remove('hint');
    yarnEl.style.transition = 'opacity 0.4s ease';
    void yarnEl.offsetWidth;
    yarnEl.style.opacity = '1';
    yarnEl.classList.add('hint');

    state.currentAction = 'playing-yarn';
    say('playing');

    let yarnX = 0, yarnY = 0;
    const yarnInterval = setInterval(() => {
      yarnX += (Math.random() - 0.5) * 40;
      yarnY += (Math.random() - 0.5) * 20;
      yarnX = Math.max(-80, Math.min(80, yarnX));
      yarnY = Math.max(-40, Math.min(40, yarnY));
      yarnEl.style.transform = `translate(${yarnX}px, ${yarnY}px) rotate(${yarnX * 3}deg)`;
      state.positionX = yarnX * 0.6;
      updateHamsterTransform();
      state.stats.happiness = Math.min(100, state.stats.happiness + 1);
      state.stats.energy = Math.max(0, state.stats.energy - 1);
      updateStatsUI();
    }, 300);

    setTimeout(() => {
      clearInterval(yarnInterval);
      state.currentAction = null;
      stopWalking();
      yarnEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      yarnEl.style.opacity = '0';
      setTimeout(() => { yarnEl.style.display = 'none'; yarnEl.style.transform = ''; }, 500);
      spawnParticles('🧶', 4);
      spawnParticles('💕', 3);
      state.stats.happiness = Math.min(100, state.stats.happiness + 10);
      updateStatsUI();
      updateMood();
      saveState();
      state.achievements.played++;
      checkAchievements();
    }, 4000);
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
    const energyDecay = getTimePeriod() === 'night' ? 0.12 : 0.05;
    state.stats.energy = Math.max(0, state.stats.energy - energyDecay);
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
      else if (getTimePeriod() === 'night' && Math.random() < 0.5) say('tired');
      else if (Math.random() < 0.3) say('idle');
    }

    // Random little life: curious gestures or a short horizontal shuffle.
    if (!state.currentAction && !state.isSpeaking && state.stats.energy >= 15) {
      const idleRoll = Math.random();
      if (idleRoll < 0.11) {
        triggerIdleGesture();
      } else if (idleRoll < 0.19) {
        startWalking();
      }
    }

    saveState();
  }

  // --- Hamster Click ---
  // Set to true right after a real accessory drag so the click that the
  // browser fires on pointerup doesn't accidentally trigger petting.
  let accessoryDragOccurred = false;

  function onHamsterClick() {
    if (accessoryDragOccurred) return;
    if (state.currentAction) return;
    state.achievements.petted++;
    animateHamster('bounce', 600);
    spawnParticles('💖', 3);
    say('petted');

    state.stats.happiness = Math.min(100, state.stats.happiness + 5);
    updateStatsUI();
    updateMood();
    saveState();
    checkAchievements();
  }

  // --- Volume Toggle ---
  function toggleSound() {
    state.isSoundOn = !state.isSoundOn;
    els.volumeToggle.textContent = state.isSoundOn ? '🔊' : '🔇';
    if (!state.isSoundOn && currentAudio) {
      currentAudio.pause();
      state.isSpeaking = false;
      setSpeakingVisual(false);
    }
    saveState();
  }

  // --- Name Change ---
  function onNameChange(e) {
    const newName = e.target.value.trim();
    if (newName) {
      state.name = newName;
      saveState();
    } else {
      e.target.value = state.name;
    }
  }

  // ========================================
  //  UNIFIED DRAG HELPER
  // ========================================
  //
  // A single pointer-drag primitive used by the ball, foods, and
  // accessories. It:
  //   - captures the pointer on the element (mouse + touch)
  //   - uses a small movement threshold so taps/clicks still work
  //   - tracks position in local variables (no getComputedStyle per move)
  //   - neutralizes CSS transforms during the drag so the element
  //     follows the pointer 1:1
  //   - cleans up on up/cancel
  //
  // Options:
  //   threshold  — px to move before "real" drag starts (default 0)
  //   onDragStart(pointer) — called once when real drag begins (after threshold)
  //   onDrag(pointer)      — called on each move (only after threshold)
  //   onDragEnd(pointer, moved) — called on up/cancel; `moved` is true if
  //                               the threshold was exceeded
  //
  // `pointer` is { x, y, dx, dy, startX, startY }
  const dragState = { active: false, el: null, cleanup: null };

  function makeDraggable(el, options = {}) {
    const threshold = options.threshold ?? 0;
    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0;
    let lastX = 0, lastY = 0;

    el.addEventListener('pointerdown', (e) => {
      if (dragState.active) return; // only one drag at a time
      e.preventDefault();
      e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
    });

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (!moved && threshold > 0) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > threshold) {
          moved = true;
          dragState.active = true;
          dragState.el = el;
          if (options.onDragStart) options.onDragStart({ x: e.clientX, y: e.clientY, dx: 0, dy: 0, startX, startY });
        }
      } else if (moved || threshold === 0) {
        if (!moved) {
          moved = true;
          dragState.active = true;
          dragState.el = el;
          if (options.onDragStart) options.onDragStart({ x: e.clientX, y: e.clientY, dx: 0, dy: 0, startX, startY });
        }
        if (options.onDrag) options.onDrag({ x: e.clientX, y: e.clientY, dx, dy, startX, startY });
      }
      lastX = e.clientX;
      lastY = e.clientY;
    }

    function onEnd(e) {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        if (options.onDragEnd) options.onDragEnd({ x: e.clientX, y: e.clientY, startX, startY }, true);
      } else {
        if (options.onDragEnd) options.onDragEnd({ x: e.clientX, y: e.clientY, startX, startY }, false);
      }
      dragState.active = false;
      dragState.el = null;
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
  }

  // ========================================
  //  THROWABLE BALL SYSTEM
  // ========================================

  const ball = {
    isDragging: false,
    isFlying: false,
    velocityX: 0,
    velocityY: 0,
    history: [],       // recent pointer positions for velocity
    animFrame: null,
    originX: 0,        // original position in scene
    originY: 0,
  };

  function initBall() {
    const ballEl = els.ball;
    if (!ballEl) return;

    let suppressed = false;

    makeDraggable(ballEl, {
      onDragStart(pointer) {
        if (ball.isFlying) { suppressed = true; return; }
        suppressed = false;
        clearTimeout(state._ballHideTimer);

        const sceneRect = els.hamsterScene.getBoundingClientRect();
        const rect = ballEl.getBoundingClientRect();
        const startLeft = rect.left - sceneRect.left;
        const startTop = rect.top - sceneRect.top;

        ball.isDragging = true;
        ball.history = [];

        ballEl.classList.add('dragging');
        ballEl.classList.remove('hint');
        ballEl.style.transition = '';
        ballEl.style.right = 'auto';
        ballEl.style.bottom = 'auto';
        ballEl.style.left = startLeft + 'px';
        ballEl.style.top = startTop + 'px';
        ballEl.style.transform = 'none';
      },
      onDrag(pointer) {
        if (suppressed || ball.isFlying) return;
        const ballEl = els.ball;
        const newLeft = parseFloat(ballEl.style.left) + pointer.dx;
        const newTop = parseFloat(ballEl.style.top) + pointer.dy;
        ballEl.style.left = newLeft + 'px';
        ballEl.style.top = newTop + 'px';

        const now = performance.now();
        ball.history.push({ x: pointer.x, y: pointer.y, t: now });
        if (ball.history.length > 6) ball.history.shift();

        spawnBallTrail(pointer.x, pointer.y);
      },
      onDragEnd(pointer, moved) {
        if (suppressed) { suppressed = false; return; }
        const ballEl = els.ball;
        ball.isDragging = false;
        ballEl.classList.remove('dragging');

        if (!moved) {
          resetBallPosition();
          state._ballHideTimer = setTimeout(hideBall, 4000);
          return;
        }

        let vx = 0, vy = 0;
        if (ball.history.length >= 2) {
          const recent = ball.history.slice(-3);
          const first = recent[0];
          const last = recent[recent.length - 1];
          const dt = (last.t - first.t) / 1000;
          if (dt > 0.001) {
            vx = (last.x - first.x) / dt;
            vy = (last.y - first.y) / dt;
          }
        }

        const speed = Math.sqrt(vx * vx + vy * vy);

        if (speed > 80) {
          ball.velocityX = vx * 0.6;
          ball.velocityY = vy * 0.6;
          ball.isFlying = true;
          ballEl.classList.add('flying');
          ballEl.style.transform = 'none';
          animateBallFlight();
        } else {
          resetBallPosition();
          state._ballHideTimer = setTimeout(hideBall, 4000);
        }
      }
    });
  }

  function animateBallFlight() {
    const ballEl = els.ball;
    ballEl.style.transform = 'none';
    const ballSize = 36;
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

      const hamsterRect = els.hamster.getBoundingClientRect();
      const ballCX = sceneRect.left + bx + ballSize / 2;
      const ballCY = sceneRect.top + by + ballSize / 2;
      const hamsterCX = hamsterRect.left + hamsterRect.width / 2;
      const hamsterCY = hamsterRect.top + hamsterRect.height / 2;
      const nearHamster = Math.hypot(ballCX - hamsterCX, ballCY - hamsterCY) < hamsterRect.width / 2 + 120;
      els.hamster.classList.toggle('tracking-ball', nearHamster);

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
    els.hamster.classList.remove('tracking-ball');

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
    els.hamster.classList.remove('tracking-ball');

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
    els.hamster.classList.remove('tracking-ball');
    ball.isFlying = false;

    const sceneRect = els.hamsterScene.getBoundingClientRect();
    const targetLeft = sceneRect.width - ballEl.offsetWidth - 10;
    const targetTop = sceneRect.height - ballEl.offsetHeight - 30;

    ballEl.style.transition = 'left 0.4s ease, top 0.4s ease';
    ballEl.style.left = targetLeft + 'px';
    ballEl.style.top = targetTop + 'px';

    setTimeout(() => {
      ballEl.style.transition = '';
      ballEl.style.left = '';
      ballEl.style.top = '';
      ballEl.style.right = '10px';
      ballEl.style.bottom = '30px';
      ballEl.style.transform = '';
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

  const FOOD_STATS = {
    seed:   { emoji: '🌻', hunger: 25, happiness: 5,  cleanliness: 3 },
    carrot: { emoji: '🥕', hunger: 20, happiness: 8,  cleanliness: 1 },
    cheese: { emoji: '🧀', hunger: 30, happiness: 12, cleanliness: 6 },
  };

  function initFoods() {
    els.foods.forEach(el => {
      let grabX = 0, grabY = 0;
      let active = false;
      let eating = false;
      let eatProgress = 0;
      let eatInterval = null;
      const TICK_MS = 250;
      const TICKS_TOTAL = 10;
      const perTick = 1 / TICKS_TOTAL;

      function stopEating() {
        if (eatInterval) { clearInterval(eatInterval); eatInterval = null; }
        if (eating) {
          eating = false;
          stopChewing();
          els.hamster.classList.remove('eating', 'mouth-open');
          state.currentAction = null;
          updateIdleState();
        }
      }

      function finishEating() {
        if (eatInterval) { clearInterval(eatInterval); eatInterval = null; }
        eating = false;
        stopChewing();
        els.hamster.classList.remove('eating', 'mouth-open');
        state.currentAction = null;
        const food = FOOD_STATS[el.dataset.food] || FOOD_STATS.seed;
        say('eating');
        spawnParticles(food.emoji, 6);
        el.style.display = 'none';
        setTimeout(() => {
          el.style.display = 'flex';
          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
          resetFoodPosition(el);
          state._foodHideTimer = setTimeout(hideFoods, 3000);
        }, 3000);
        updateIdleState();
        saveState();
      }

      makeDraggable(el, {
        onDragStart(pointer) {
          if (state.currentAction) { active = false; return; }
          active = true;
          eating = false;
          eatProgress = 0;
          if (eatInterval) { clearInterval(eatInterval); eatInterval = null; }
          clearTimeout(state._foodHideTimer);

          const rect = el.getBoundingClientRect();
          grabX = pointer.x - rect.left;
          grabY = pointer.y - rect.top;

          el.classList.add('dragging');
          el.classList.remove('hint');
          el.style.margin = '0';
          el.style.left = rect.left + 'px';
          el.style.top = rect.top + 'px';
          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
        },
        onDrag(pointer) {
          if (!active) return;
          el.style.left = (pointer.x - grabX) + 'px';
          el.style.top = (pointer.y - grabY) + 'px';

          const over = foodOverHamster(el);
          const canEat = over && (!state.currentAction || state.currentAction === 'eating') && state.stats.hunger < 100;

          if (canEat && !eating) {
            eating = true;
            eatProgress = 0;
            state.currentAction = 'eating';
            clearHamsterActionClasses();
            els.hamster.classList.add('eating', 'mouth-open');
            startChewing();
            const food = FOOD_STATS[el.dataset.food] || FOOD_STATS.seed;
            eatInterval = setInterval(() => {
              eatProgress += perTick;
              const scale = Math.max(0.05, 1 - eatProgress);
              el.style.transform = 'scale(' + scale + ')';
              el.style.opacity = String(Math.max(0, 1 - eatProgress));
              state.stats.hunger = Math.min(100, state.stats.hunger + food.hunger * perTick);
              state.stats.happiness = Math.min(100, state.stats.happiness + food.happiness * perTick);
              state.stats.cleanliness = Math.max(0, state.stats.cleanliness - food.cleanliness * perTick);
              updateStatsUI();
              updateMood();
              if (eatProgress >= 1) {
                finishEating();
              }
            }, TICK_MS);
          } else if (!canEat && eating) {
            stopEating();
          }

          if (over && !eating) {
            els.hamster.classList.add('mouth-open');
          } else if (!over) {
            els.hamster.classList.remove('mouth-open');
          }

          spawnFoodTrail(pointer.x, pointer.y, el.dataset.food);
        },
        onDragEnd(pointer, moved) {
          if (!active) return;
          active = false;
          const wasEating = eating;
          stopEating();

          if (wasEating && eatProgress >= 1) {
            return;
          }

          if (moved && foodOverHamster(el) && state.stats.hunger >= 100) {
            speak('Ya estoy llenito, chicas');
          }

          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
          resetFoodPosition(el);
          state._foodHideTimer = setTimeout(hideFoods, 4000);
        }
      });
    });
  }

  // True when the food's center is over the hamster. Uses live bounding
  // rects so it works no matter where the food lives in the layout.
  function foodOverHamster(foodEl) {
    const f = foodEl.getBoundingClientRect();
    const h = els.hamster.getBoundingClientRect();
    const fcx = f.left + f.width / 2;
    const fcy = f.top + f.height / 2;
    const hcx = h.left + h.width / 2;
    const hcy = h.top + h.height / 2;
    const dist = Math.hypot(fcx - hcx, fcy - hcy);
    return dist < (h.width / 2 + f.width / 2 + 5);
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

  function resetFoodPosition(foodEl) {
    if (!foodEl.classList.contains('dragging')) {
      foodEl.classList.add('hint');
      return;
    }

    const startLeft = parseFloat(foodEl.style.left) || 0;
    const startTop = parseFloat(foodEl.style.top) || 0;

    foodEl.classList.remove('dragging');
    foodEl.style.transition = '';
    foodEl.style.left = '';
    foodEl.style.top = '';
    foodEl.style.margin = '';
    const natural = foodEl.getBoundingClientRect();

    foodEl.classList.add('dragging');
    foodEl.style.left = startLeft + 'px';
    foodEl.style.top = startTop + 'px';
    foodEl.style.margin = '0';
    void foodEl.offsetWidth;
    foodEl.style.transition = 'left 0.3s ease, top 0.3s ease';
    foodEl.style.left = natural.left + 'px';
    foodEl.style.top = natural.top + 'px';

    setTimeout(() => {
      foodEl.classList.remove('dragging');
      foodEl.style.left = '';
      foodEl.style.top = '';
      foodEl.style.margin = '';
      foodEl.style.transition = '';
      foodEl.classList.add('hint');
    }, 300);
  }

  function onFeedBtnClick() {
    stopWalking();

    // Clear any previous hide timer
    clearTimeout(state._foodHideTimer);

    const foodEls = els.foods;
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
  }

  function hideFoods() {
    const foodEls = els.foods;
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
    els.wardrobeModal.classList.remove('visible');
  }

  function onHatSelect(e) {
    const btn = e.currentTarget;
    const selectedHat = btn.dataset.hat;
    
    state.hat = selectedHat;
    saveState();
    applyHat(selectedHat);
    
    if (selectedHat) {
      state.achievements.hatsCollected++;
      checkAchievements();
    }

    // Update UI
    els.hatOptions.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  function applyHat(hatValue) {
    if (hatValue) {
      if (hatValue.includes('.svg') || hatValue.includes('.png')) {
        els.hamsterHat.textContent = '';
        els.hamsterHat.style.backgroundImage = `url('${hatValue}')`;
      } else {
        els.hamsterHat.style.backgroundImage = 'none';
        els.hamsterHat.textContent = hatValue;
      }
      els.hamsterHat.style.display = 'block';

      if (state.hatTop && state.hatLeft) {
        els.hamsterHat.style.top = state.hatTop;
        els.hamsterHat.style.left = state.hatLeft;
        els.hamsterHat.style.transform = 'none';
      } else {
        els.hamsterHat.style.top = '-90px';
        els.hamsterHat.style.left = '50%';
        els.hamsterHat.style.transform = '';
      }
    } else {
      els.hamsterHat.textContent = '';
      els.hamsterHat.style.backgroundImage = 'none';
      els.hamsterHat.style.display = 'none';
    }
  }

  // Shared, robust drag handler for the hat and glasses. Uses a small
  // movement threshold so a simple tap still pets the hamster, captures the
  // pointer on the element itself (works for mouse + touch), and suppresses
  // the trailing click after a real drag.
  function makeAccessoryDraggable(el, onSave) {
    let startLeft = 0, startTop = 0;

    makeDraggable(el, {
      threshold: 4,
      onDragStart(pointer) {
        const rect = el.getBoundingClientRect();
        const parentRect = el.offsetParent.getBoundingClientRect();
        const relLeft = rect.left - parentRect.left;
        const relTop = rect.top - parentRect.top;

        el.style.transform = 'none';
        el.style.left = relLeft + 'px';
        el.style.top = relTop + 'px';

        startLeft = relLeft;
        startTop = relTop;
      },
      onDrag(pointer) {
        el.style.left = (startLeft + (pointer.x - pointer.startX)) + 'px';
        el.style.top = (startTop + (pointer.y - pointer.startY)) + 'px';
      },
      onDragEnd(pointer, moved) {
        if (moved) {
          accessoryDragOccurred = true;
          setTimeout(() => { accessoryDragOccurred = false; }, 0);
          onSave(el.style.top, el.style.left);
        }
      }
    });
  }

  function initHatDrag() {
    makeAccessoryDraggable(els.hamsterHat, (top, left) => {
      state.hatTop = top;
      state.hatLeft = left;
      saveState();
    });
  }

  // ========================================
  //  GLASSES SYSTEM
  // ========================================

  function openGlasses() {
    if (state.currentAction) return;
    
    els.glassesOptions.forEach(btn => {
      if (btn.dataset.glasses === state.glasses) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    els.glassesModal.classList.add('visible');
  }

  function closeGlasses() {
    els.glassesModal.classList.remove('visible');
  }

  function onGlassesSelect(e) {
    const btn = e.currentTarget;
    const selectedGlasses = btn.dataset.glasses;
    
    state.glasses = selectedGlasses;
    saveState();
    applyGlasses(selectedGlasses);
    
    els.glassesOptions.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  function applyGlasses(glassesValue) {
    if (glassesValue) {
      if (glassesValue.includes('.svg') || glassesValue.includes('.png')) {
        els.hamsterGlasses.textContent = '';
        els.hamsterGlasses.style.backgroundImage = `url('${glassesValue}')`;
      } else {
        els.hamsterGlasses.style.backgroundImage = 'none';
        els.hamsterGlasses.textContent = glassesValue;
      }
      els.hamsterGlasses.style.display = 'block';

      if (state.glassesTop && state.glassesLeft) {
        els.hamsterGlasses.style.top = state.glassesTop;
        els.hamsterGlasses.style.left = state.glassesLeft;
        els.hamsterGlasses.style.transform = 'none';
      } else {
        els.hamsterGlasses.style.top = '15px';
        els.hamsterGlasses.style.left = '50%';
        els.hamsterGlasses.style.transform = '';
      }
    } else {
      els.hamsterGlasses.textContent = '';
      els.hamsterGlasses.style.backgroundImage = 'none';
      els.hamsterGlasses.style.display = 'none';
    }
  }

  function initGlassesDrag() {
    makeAccessoryDraggable(els.hamsterGlasses, (top, left) => {
      state.glassesTop = top;
      state.glassesLeft = left;
      saveState();
    });
  }

  function getTimePeriod() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'sunset';
    if (hour >= 20 || hour < 5) return 'night';
    return 'dawn';
  }

  function applyTimePeriod() {
    const period = getTimePeriod();
    document.body.classList.remove('time-day', 'time-sunset', 'time-night', 'time-dawn');
    document.body.classList.add('time-' + period);
  }

  function initDayNightCycle() {
    applyTimePeriod();
    setInterval(applyTimePeriod, 60000);
  }

  const ACHIEVEMENT_DEFS = [
    { id: 'firstMeal',    badge: 'badge_primeracomida', name: 'Primera comida',    check: () => state.achievements.fed >= 1 },
    { id: 'player',       badge: 'badge_jugador',       name: 'Jugador',           check: () => state.achievements.played >= 5 },
    { id: 'sleeper',      badge: 'badge_dormilon',      name: 'Dormilón',          check: () => state.achievements.slept >= 5 },
    { id: 'clean',        badge: 'badge_limpieza',      name: 'Limpieza',          check: () => state.achievements.cleaned >= 5 },
    { id: 'loving',       badge: 'badge_cariñoso',      name: 'Cariñoso',          check: () => state.achievements.petted >= 10 },
    { id: 'stylist',      badge: 'badge_estilista',     name: 'Estilista',         check: () => state.achievements.hatsCollected >= 3 },
    { id: 'athlete',      badge: 'badge_atleta',        name: 'Atleta',            check: () => state.achievements.wheelRuns >= 5 },
    { id: 'dancer',       badge: 'badge_bailarin',      name: 'Bailarín',          check: () => state.achievements.dances >= 3 },
    { id: 'collector',    badge: 'badge_coleccionista', name: 'Coleccionista',     check: () => state.achievements.unlocked.length >= 5 },
    { id: 'master',       badge: 'badge_maestro',       name: 'Maestro hámster',   check: () => state.achievements.unlocked.length >= 8 },
  ];

  function checkAchievements() {
    ACHIEVEMENT_DEFS.forEach(def => {
      if (!state.achievements.unlocked.includes(def.id) && def.check()) {
        state.achievements.unlocked.push(def.id);
        showBadgeUnlock(def);
        renderBadges();
        saveState();
      }
    });
  }

  function showBadgeUnlock(def) {
    const notif = document.createElement('div');
    notif.className = 'badge-notif';
    notif.innerHTML = `<img src="assets/hamster_ilu/logros/${def.badge}.svg" alt="${def.name}"><span>¡Logro: ${def.name}!</span>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
  }

  function renderBadges() {
    const container = document.querySelector('.badge-wall');
    if (!container) return;
    container.innerHTML = '';
    state.achievements.unlocked.forEach(id => {
      const def = ACHIEVEMENT_DEFS.find(d => d.id === id);
      if (!def) return;
      const img = document.createElement('img');
      img.src = `assets/hamster_ilu/logros/${def.badge}.svg`;
      img.alt = def.name;
      img.className = 'badge-icon';
      img.title = def.name;
      container.appendChild(img);
    });
  }

  function openHabitat() {
    els.habitatOptions.forEach(btn => {
      const type = btn.dataset.habitatType;
      const value = btn.dataset.habitatValue;
      if (state.habitat[type] === value) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
    els.habitatModal.classList.add('visible');
  }
  function closeHabitat() {
    els.habitatModal.classList.remove('visible');
  }
  function onHabitatSelect(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.habitatType;
    const value = btn.dataset.habitatValue;
    state.habitat[type] = value;
    saveState();
    applyHabitat();
    els.habitatOptions.forEach(b => {
      if (b.dataset.habitatType === type) b.classList.remove('selected');
    });
    btn.classList.add('selected');
  }
  function applyHabitat() {
    els.habitatWall.style.backgroundImage = state.habitat.wall ? `url('${state.habitat.wall}')` : 'none';
    els.habitatFloor.style.backgroundImage = state.habitat.floor ? `url('${state.habitat.floor}')` : 'none';
    els.habitatDeco.style.backgroundImage = state.habitat.deco ? `url('${state.habitat.deco}')` : 'none';
  }

  function init() {
    if (initDone) return;
    initDone = true;
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
    els.feedBtn.addEventListener('click', handleActionClick(onFeedBtnClick));
    els.playBtn.addEventListener('click', handleActionClick(play));
    els.sleepBtn.addEventListener('click', handleActionClick(sleep));
    els.cleanBtn.addEventListener('click', handleActionClick(clean));
    els.petBtn.addEventListener('click', handleActionClick(pet));
    els.talkBtn.addEventListener('click', handleActionClick(talk));
    els.wardrobeBtn.addEventListener('click', handleActionClick(openWardrobe));
    els.wardrobeCloseBtn.addEventListener('click', closeWardrobe);
    els.btnGlasses.addEventListener('click', handleActionClick(openGlasses));
    els.btnGlassesClose.addEventListener('click', closeGlasses);
    els.wheelBtn.addEventListener('click', handleActionClick(wheel));
    els.danceBtn.addEventListener('click', handleActionClick(dance));
    els.brushBtn.addEventListener('click', handleActionClick(brush));
    els.yarnBtn.addEventListener('click', handleActionClick(playYarn));
    els.habitatBtn.addEventListener('click', handleActionClick(openHabitat));
    els.btnHabitatClose.addEventListener('click', closeHabitat);
    els.habitatOptions.forEach(btn => btn.addEventListener('click', onHabitatSelect));
    els.hamster.addEventListener('click', handleActionClick(onHamsterClick));
    els.volumeToggle.addEventListener('click', toggleSound);
    els.nameInput.addEventListener('change', onNameChange);

    els.hatOptions.forEach(btn => {
      btn.addEventListener('click', onHatSelect);
    });
    
    els.glassesOptions.forEach(btn => {
      btn.addEventListener('click', onGlassesSelect);
    });

    // Apply saved accessories
    applyHat(state.hat);
    applyGlasses(state.glasses);
    applyHabitat();

    // Init systems
    initBall();
    initFoods();
    initHatDrag();
    initGlassesDrag();

    // Ensure voices are loaded

    initDayNightCycle();

    // Welcome message
    setTimeout(() => {
      const { hunger, happiness, energy } = state.stats;
      if (hunger < 30) {
        say('hungry');
      } else if (energy < 30) {
        say('tired');
      } else {
        say('idle');
      }
    }, 800);

    // Game loop: every 3 seconds
    tickInterval = setInterval(tick, 3000);

    // Save periodically
    saveInterval = setInterval(saveState, 30000);

    renderBadges();
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { state, feed, play, sleep, clean, pet, talk };
})();

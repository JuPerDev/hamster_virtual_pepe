# Pepe — Mi Hámster Virtual

Pepe es una mascota virtual de escritorio construida íntegramente con **HTML, CSS y JavaScript vanilla** (sin frameworks, sin paso de build, sin dependencias npm). El hámster se llama Pepe y "vive" con Pepe (el papá) y sus hijas Abby y Pascal; toda su voz está actuada en español mediante 67 archivos mp3. El proyecto es una sola página que se abre directamente en el navegador y persiste su estado en `localStorage`, con decaimiento temporal de stats entre sesiones.

## Visión general

- **Propósito:** ofrecer un hámster virtual afectuoso y conversador que las niñas puedan alimentar, vestir, acariciar y escuchar.
- **Audiencia objetivo:** la familia (Pepe papá + Abby y Pascal). Las frases de voz nombran a las niñas directamente.
- **Por qué existe:** proyecto personal/familiar para divertir y enseñar, sin intención de distribución pública. Se prioriza la simplicidad (cero tooling) y la voz real grabada sobre sintetizar texto.

## Arquitectura

- Aplicación de **una sola página**, sin framework ni build. Toda la lógica vive en un único módulo IIFE `HamsterPet` en `script.js:5`, que expone una API pública mínima en `script.js:1460`: `{ state, feed, play, sleep, clean, pet, talk }`.
- El hámster se renderiza como **ilustración 2D SVG** mediante `.hamster-ilu` (`index.html:49`, `style.css:187`), con animación de parpadeo (`@keyframes hamsterBlinkAnim`, `style.css:196`). Se eliminó el antiguo sistema 3D.
- **Sistema de diseño** con custom properties CSS (`style.css:6-41`: paleta, gradientes, radios, transiciones). Layout a base de flexbox; animaciones de estado con clases CSS sobre `#hamster` (`idle`, `walking`, `happy`, `bounce`, `eating`, `sleeping`, `catching`, `mouth-open`).
- **Pointer Events** para todo el arrastre (comida, pelota, accesorios): funciona unificado para ratón y táctil. `setPointerCapture` en cada elemento.
- **Audio** vía `HTMLAudioElement` (`new Audio(src)`, `script.js:233`); un solo `currentAudio` global, cortado al iniciar el siguiente.
- **Persistencia** en `localStorage` (clave `hamster_pet_state`), con decaimiento temporal de stats al cargar.
- **Guard de init** (`script.js:1384`) con flag `initDone` y almacenamiento de los IDs `tickInterval`/`saveInterval` para evitar duplicación.

```
            ┌──────────────────────────────────────────────┐
            │                  index.html                  │
            │  (marcado + <link> a Google Fonts + 2 CSS/JS)│
            └───────────┬──────────────────────┬───────────┘
                        │                      │
              carga style.css            carga script.js
                        │                      │
                        ▼                      ▼
               ┌────────────────┐     ┌──────────────────────┐
               │    style.css   │     │   HamsterPet (IIFE)  │
               │  design system │     │   script.js:5-1461   │
               │  + animaciones │     │                      │
               └────────────────┘     │  state · phrases     │
                                      │  actions · tick      │
                                      │  ball · foods        │
                                      │  wardrobe · glasses  │
                                      │  audio · persist     │
                                      └───┬──────────────┬───┘
                                          │              │
                            DOM (getElementById)   localStorage
                                          │              │
                              ┌───────────▼──────────▼───┐
                              │   #hamster, stats, ball, │
                              │   foods, modals, audio   │
                              └───────────┬──────────────┘
                                          │
                              recursos: assets/*.svg + sounds/*.mp3
```

## Estructura de archivos

Verificada listando el directorio (junio 2026). **No hay** `node_modules/`, `vendor/`, `package.json` ni `hamster-3d.js`: el proyecto es 100% vanilla.

```
hamster-pet/
├── .gitignore                 # .DS_Store, node_modules/
├── README.md                  # Documentación en español
├── contexto.md                # Inventario de frases y sonidos (13 categorías)
├── index.html                 # 225 líneas — marcado principal
├── script.js                  # 1461 líneas — lógica (módulo HamsterPet)
├── style.css                  # 1053 líneas — design system + animaciones
├── proyecto.md                # (este documento)
├── assets/
│   └── hamster_ilu/
│       ├── hamster_01.svg
│       ├── hamster_02.svg
│       ├── hamster_03.svg
│       ├── accesorios/        # 7 gorros SVG
│       │   ├── gorro_brujo.svg
│       │   ├── corona_dorada.svg
│       │   ├── gorra_urbana.svg
│       │   ├── gorro_lana_magenta.svg
│       │   ├── gorro_navideno.svg
│       │   ├── sombrero_copa_profesional.svg
│       │   └── sombrero_cowboy.svg
│       └── lentes/            # 4 lentes SVG
│           ├── celestes.svg
│           ├── estrella.svg
│           ├── negros.svg
│           └── rojos.svg
└── sounds/                    # 67 archivos mp3 de voz en español
    ├── idle_1.mp3 … idle_8.mp3
    ├── hungry_1 … hungry_5.mp3
    ├── happy_1 … happy_5.mp3
    ├── sad_1 … sad_5.mp3
    ├── tired_1 … tired_5.mp3
    ├── dirty_1 … dirty_4.mp3
    ├── eating_1 … eating_5.mp3
    ├── playing_1 … playing_5.mp3
    ├── sleeping_1 … sleeping_3.mp3
    ├── petted_1 … petted_5.mp3
    ├── clean_1 … clean_4.mp3
    ├── ballCatch_1 … ballCatch_6.mp3
    ├── ballMiss_1 … ballMiss_3.mp3
    └── inline_{full,tired,awake,clean}.mp3
```

## Modelo de estado

El objeto `state` se define en `script.js:7-27`. Algunos campos extras (`hatTop`, `hatLeft`, `glasses`, `glassesTop`, `glassesLeft`) se añaden en `loadState` (`script.js:40-44`) al cargar desde `localStorage`.

| Campo              | Tipo      | Origen              | Significado                                                        |
|--------------------|-----------|---------------------|--------------------------------------------------------------------|
| `name`             | `string`  | state / persisted   | Nombre del hámster (default `'PEPE'`)                              |
| `stats.hunger`     | `number`  | state / persisted   | 0-100, hambre (alto = saciado)                                     |
| `stats.happiness`  | `number`  | state / persisted   | 0-100, felicidad                                                   |
| `stats.energy`     | `number`  | state / persisted   | 0-100, energía                                                     |
| `stats.cleanliness`| `number`  | state / persisted   | 0-100, limpieza                                                    |
| `mood`             | `string`  | derivado            | Estado de ánimo actual (`updateMood`, solo escritura)              |
| `isSpeaking`       | `boolean` | runtime             | `true` mientras suena un mp3                                       |
| `isSoundOn`        | `boolean` | state / persisted   | Volumen global on/off                                              |
| `currentAction`    | `string\|null` | runtime        | Acción en curso (`eating`, `sleeping`, `cleaning`, `petted`, …)    |
| `birthTime`        | `number`  | state / persisted   | `Date.now()` del nacimiento (para la edad)                         |
| `lastUpdate`       | `number`  | state               | Marca de tiempo de la última actualización                         |
| `positionX`        | `number`  | runtime             | Offset horizontal del hámster (px)                                 |
| `facingDirection`  | `number`  | runtime             | Dirección de mirada (1 / -1)                                       |
| `isWalking`        | `boolean` | runtime             | `true` durante un paseo aleatorio                                  |
| `hat`             | `string`  | persisted           | URL del gorro SVG actual (vacío = sin gorro)                       |
| `hatTop`          | `string\|null` | persisted       | Posición vertical guardada del gorro (drag)                        |
| `hatLeft`         | `string\|null` | persisted       | Posición horizontal guardada del gorro                             |
| `glasses`         | `string`  | persisted           | URL de los lentes SVG actuales                                     |
| `glassesTop`      | `string\|null` | persisted       | Posición vertical guardada de los lentes                           |
| `glassesLeft`     | `string\|null` | persisted       | Posición horizontal guardada de los lentes                         |

### Stats y decaimiento

| Stat          | Decaimiento por tick (3s) | Decay offline (proporción de `decay`) |
|---------------|---------------------------|----------------------------------------|
| `hunger`        | `-0.15`                     | `×1.0`  |
| `happiness`     | `-0.08`                     | `×0.4`  |
| `energy`        | `-0.05`                     | `×0.3`  |
| `cleanliness`   | `-0.04`                     | `×0.2`  |

Decaimiento offline al cargar (`script.js:47-54`): si `minutesAway > 1`, `decay = min(minutesAway * 0.5, 40)`, repartido con los pesos de la tabla (hunger pierde más, cleanliness pierde menos). El tick se salta mientras `currentAction === 'sleeping'` (`script.js:617`).

### Lógica de estado de ánimo (`updateMood`, `script.js:335-370`)

Prioridad en cascada (primera rama que cumple gana):

1. `currentAction === 'sleeping'` → 😴 Durmiendo
2. `hunger < 20` → 😫 Hambriento
3. `energy < 20` → 😪 Cansado
4. `cleanliness < 20` → 🫣 Sucio
5. promedio > 75 → 😊 Feliz
6. promedio > 50 → 🙂 Normal
7. promedio > 25 → 😟 Triste
8. else → 😢 Mal

## Bucle de juego (game loop)

- `setInterval(tick, 3000)` (`script.js:1447`) impulsa el decaimiento de stats, refresca UI, mood, edad, idle, y dos comportamientos aleatorios:
  - **Chatter idle** (2% de probabilidad, `script.js:630`): si `hunger < 20` dice `hungry`; si `energy < 15` dice `tired`; si no, 30% de probabilidad de decir `idle`.
  - **Paseo aleatorio** (8% de probabilidad, `script.js:638`): solo si está idle, no hablando y `energy >= 15`. Mueve el hámster a un offset aleatorio en ±18 px durante 900 ms (`startWalking`, `script.js:405`).
- `setInterval(saveState, 30000)` (`script.js:1450`) persiste el estado periódicamente.
- `initDone` (`script.js:1384`) evita doble inicialización; `tickInterval` y `saveInterval` guardan los IDs por si hace falta limpiar.

## Sistemas principales

### 1. Acciones del usuario

`feed`, `play`, `sleep`, `clean`, `pet`, `talk` (`script.js:447-613`). Cada una:

1. valida precondiciones (hambre llena, energía baja, ya limpio…) y emite una frase inline si no procede;
2. fija `state.currentAction`;
3. anima con `animateHamster(className, duration)`;
4. reproduce voz con `say(category)`;
5. actualiza stats (clamp 0-100);
6. `disableButtons(ms)` deshabilita los 6 botones principales brevemente (`script.js:441`);
7. al terminar, limpia `currentAction` y llama `updateIdleState()`.

El wrapper `handleActionClick(actionFn)` (`script.js:523-531`) intercepta cualquier clic cuando el hámster está durmiendo: lo despierta silenciosamente con `wakeUp(true)` y, si el botón pulsado era `sleep`, no hace nada más (solo despertar).

### 2. Alimentación por arrastrar y soltar

- `onFeedBtnClick` (`script.js:1125`) revela las 3 comidas (`#food-seed`, `#food-carrot`, `#food-cheese`) con fade-in + rebote `cubic-bezier(0.34,1.56,0.64,1)` y un pulso secuencial (`el.animate`, `script.js:1144`). Auto-hide a los 10 s de inactividad.
- Arrastre con Pointer Events: `onFoodPointerDown/Move/Up` (`script.js:989/1014/1045`). En `pointerdown` se calcula el offset del puntero dentro de la comida y se pasa a `position: fixed` para que siga 1:1.
- Colisión `foodOverHamster(foodEl)` (`script.js:978-987`): distancia entre centros < `hamsterWidth/2 + foodWidth/2 + 5`. Mientras la comida está sobre el hámster, se añade la clase `mouth-open`.
- `feedFromDrag(foodType, foodEl)` (`script.js:1070-1113`) aplica los deltas por comida:

  | Comida   | hunger | happiness | cleanliness |
  |----------|--------|-----------|-------------|
  | seed 🌻  | +25    | +5        | -3          |
  | carrot 🥕| +20    | +8        | -1          |
  | cheese 🧀| +30    | +12       | -6          |

  Auto-hide 3 s después de comer; si el hámster ya está lleno, reproduce `inline_full.mp3` y reubica la comida.

### 3. Pelota lanzable

- `initBall` (`script.js:706`) guarda la posición origen y registra listeners de puntero.
- `onBallPointerDown/Move/Up` (`script.js:721/750/781`). Durante el arrastre se mantiene un historial de las últimas 6 posiciones (`ball.history`, `script.js:771`) para estimar la velocidad.
- `onBallPointerUp` (`script.js:781`): calcula `vx, vy` con los últimos 3 puntos; si `speed > 80` lanza la pelota (velocidad × 0.6); si no, la devuelve al origen y programa auto-hide.
- `animateBallFlight` (`script.js:817`): integración por `requestAnimationFrame` con `dt = 0.016`, **gravedad 1.5**, **rebote en paredes y suelo con damping 0.7**, y `velocityX *= 0.9` al tocar el suelo.
- `checkHamsterCollision` (`script.js:866`): distancia entre centros < `hamsterWidth/2 + ballSize/2 + 5` → `onBallCatch` (`script.js:883`): `say('ballCatch')`, +12 felicidad, -5 energía, partículas ⭐ y 🎾, devuelve la pelota en 900 ms y auto-hide a los 3 s.
- Si la pelota se queda casi quieta en el suelo → `onBallMiss` (`script.js:907`): `say('ballMiss')`, animación `bounce`, devuelve y auto-hide.
- `spawnBallTrail` (`script.js:946`) deja estelas de 500 ms durante el arrastre.

### 4. Dormir y auto-sueño

- `sleep()` (`script.js:533`): fija `currentAction = 'sleeping'`, añade la clase, muestra `#zzz-container`, `say('sleeping')` y arranca `restInterval = setInterval(..., 1500)`: **+10 energía, -1 hambre** por tick, `saveState()`, auto-despertar al llegar a 100.
- `wakeUp(silent = false)` (`script.js:507`): limpia `restInterval`, quita Zzz, y si no es silencioso hace `bounce` + `inline_awake.mp3`.
- `updateIdleState()` (`script.js:385-397`): **cuando `energy < 15` llama a `sleep()` automáticamente** (bug corregido en esta revisión — antes solo mostraba la animación visual para siempre sin recuperar energía ni sincronizar el mood).

### 5. Armario (gorros y lentes)

- Dos modales (`#wardrobe-modal`, `#glasses-modal`) con grilla de opciones SVG (`index.html:159-221`): **7 gorros + opción "sin gorro"** (8 botones) y **4 lentes + opción "sin lentes"** (5 botones).
- `applyHat` (`script.js:1225`) y `applyGlasses` (`script.js:1350`) ponen el SVG como `background-image` y posicionan según `state.hatTop/hatLeft` (o defaults `-90px`/`50%` para gorro, `-50px`/`50%` para lentes).
- `makeAccessoryDraggable(el, onSave)` (`script.js:1254`) es el handler compartido de arrastre: usa **umbral de movimiento de 4 px** (`script.js:1273`) para distinguir un tap (que sigue acariciando al hámster) de un arrastre real, captura el puntero en el elemento, y al soltar tras movimiento guarda la posición en `state` y llama a `saveState`. La flag `accessoryDragOccurred` (`script.js:648`) suprime el `click` residual que el navegador dispara tras un `pointerup` de arrastre real.

### 6. Sistema de voz

- `playAudio(src)` (`script.js:233`): corta el `currentAudio` anterior, crea `new Audio(src)`, fija `isSpeaking = true` y lo libera al terminar.
- `playPhraseAudio(category, index)` (`script.js:252`): construye `sounds/${category}_${index+1}.mp3`.
- `inlineAudioMap` (`script.js:257-262`): 4 frases fijas con su mp3:

  | Texto                                   | Archivo                |
  |-----------------------------------------|------------------------|
  | `'Ya estoy llenito, chicas'`            | `inline_full.mp3`      |
  | `'Chicas, estoy muy cansadito'`         | `inline_tired.mp3`     |
  | `'Abby, Pascal, desperté con energía'`  | `inline_awake.mp3`     |
  | `'Chicas, ya estoy limpiecito'`         | `inline_clean.mp3`     |

- `speak(text)` (`script.js:264`) busca en `inlineAudioMap` y reproduce si existe.
- `say(category)` (`script.js:271`) elige una frase aleatoria de `phrases[category]` y reproduce su mp3.
- La burbuja de diálogo (speech bubble) está **eliminada intencionalmente**: la experiencia es 100% voz.
- **Política de autoplay:** el navegador bloquea audio sin interacción previa; el primer clic en 🔊 desbloquea el resto.

### 7. Animación

- `animateHamster(className, duration = 800)` (`script.js:296`): quita las clases de estado previas, fuerza reflow (`void offsetWidth`), añade la nueva, y a los `duration` ms la retira y llama `updateIdleState`. Excepciones: `idle` y `walking` no se auto-quitan; `sleeping` tampoco.
- Clases CSS sobre `#hamster` mapeadas a `@keyframes` en `style.css`:
  - `idle` → `hamsterIdle` (`style.css:241`)
  - `walking` → `hamsterWalkBody` (`style.css:977`)
  - `happy` → `hamsterHappy` (`style.css:220`)
  - `bounce` → `hamsterBounce` (`style.css:211`)
  - `eating` → `hamsterEat` (`style.css:229`)
  - `sleeping` → parpadeo detenido + `zzz` flotando (`zzzFloat`, `style.css:284`)
  - `catching` → `hamsterCatch` (`style.css:678`)
  - `mouth-open` → se añade durante el arrastre de comida sobre el hámster.
- `.hamster-ilu` (`style.css:187`) es el SVG visible con parpadeo propio (`@keyframes hamsterBlinkAnim`, `style.css:196`).
- El paseo se implementa con `translate3d(${positionX}px, 0, 0)` (`script.js:402`).

### 8. Persistencia

- Clave `hamster_pet_state` en `localStorage`.
- `loadState` (`script.js:30-59`): mezcla `stats`, restaura nombre/sonido/birthTime/accesorios, y aplica el decaimiento offline.
- `saveState` (`script.js:61-79`): serializa stats, nombre, sonido, birthTime, gorro y lentes (con sus posiciones) y `lastSave`.
- Se persiste en: cada acción (`feed`, `play`, `sleep`, `clean`, `pet`, `wakeUp`, `onHamsterClick`, `onHatSelect`, `onGlassesSelect`, arrastre de accesorios), cada 30 s (`saveInterval`), y en `onNameChange` (`script.js:674`).

## Inventario de voz

Inventario completo en `contexto.md`. **67 archivos mp3** en español, todas las frases nombran a Abby y/o Pascal. Distribución:

| Categoría       | Categoría interna | Nº de frases | Rango de archivos              |
|-----------------|-------------------|--------------|--------------------------------|
| Idle            | `idle`            | 8            | `idle_1` … `idle_8`            |
| Hambriento      | `hungry`          | 5            | `hungry_1` … `hungry_5`        |
| Feliz           | `happy`           | 5            | `happy_1` … `happy_5`          |
| Triste          | `sad`             | 5            | `sad_1` … `sad_5`              |
| Cansado         | `tired`           | 5            | `tired_1` … `tired_5`          |
| Sucio           | `dirty`           | 4            | `dirty_1` … `dirty_4`          |
| Comiendo        | `eating`          | 5            | `eating_1` … `eating_5`        |
| Jugando         | `playing`         | 5            | `playing_1` … `playing_5`      |
| Durmiendo       | `sleeping`        | 3            | `sleeping_1` … `sleeping_3`    |
| Acariciado      | `petted`          | 5            | `petted_1` … `petted_5`        |
| Limpio          | `clean`           | 4            | `clean_1` … `clean_4`          |
| Pelota atrapada | `ballCatch`       | 6            | `ballCatch_1` … `ballCatch_6`  |
| Pelota fallida  | `ballMiss`        | 3            | `ballMiss_1` … `ballMiss_3`    |
| Inline          | —                 | 4            | `inline_full/tired/awake/clean` |

**Total: 63 frases categorizadas + 4 inline = 67 mp3.**

## Accesibilidad

Implementado:

- `lang="es"` y `<meta name="description">` (`index.html:2,6`).
- `<main class="app-container">` y `<header>` como landmarks (`index.html:19,22`).
- `aria-label` en toggle de volumen, input de nombre y 8 botones de gorro + 5 de lentes; `alt` en todas las imágenes de accesorios (`index.html:165-214`).
- `#hamster` con `role="button"`, `tabindex="0"` y `aria-label` (`index.html:46`).

Limitaciones conocidas:

- Los modales no se cierran con Escape ni tienen focus trap.
- Las interacciones de arrastre (comida, pelota, accesorios) son solo para puntero: no hay equivalente de teclado.

## Cómo ejecutar

Al ser vanilla, basta con abrir `index.html` en un navegador moderno. Por el soporte de ES modules y las políticas de autoplay de audio, se recomienda servirlo por HTTP local:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

El audio requiere un gesto previo del usuario: haz clic en el botón 🔊 para activar el sonido antes de interactuar con Pepe.

## Cambios aplicados en esta revisión (2026-06-22)

- **Eliminado el sistema 3D muerto:** `hamster-3d.js`, `vendor/three/`, `assets/hamster.glb`, `node_modules/` (nunca se cargaba en `index.html`; el CSS lo ocultaba). Queda la ilustración 2D SVG `.hamster-ilu`.
- **Eliminado código muerto de IA (Gemini):** 6 campos de `state` (`apiKey`, `geminiModel`, `chatHistory`, `memories`, `isAiEnabled`, `isAiThinking`) + guardas `isAiThinking` + 2 entradas del `inlineAudioMap` + sonidos `inline_ai_on.mp3` e `inline_amnesia.mp3`.
- **Eliminada la burbuja de diálogo** (speech bubble) que era un no-op intencional: HTML, CSS, función `showBubble`, `els.speechBubble`/`speechText` y todas las llamadas. Experiencia 100% voz.
- **Corregido el emoji de zanahoria** (carácter U+FFFD → 🥕) en `index.html:77`.
- **Corregido el mismatch de `speak('Desperté con mucha energía')`** → ahora la clave del `inlineAudioMap` es `'Abby, Pascal, desperté con energía'` y reproduce `inline_awake.mp3`.
- **Nombre por defecto unificado a `'PEPE'`** (antes `'Bolita'` en `state` vs `'PEPE'` en HTML/`loadState`).
- **Eliminada la 9ª frase idle** (`idle_9.mp3` no existía; 1 de cada 9 idle fallaba en silencio). Ahora son 8.
- **Conectada la categoría de voz `playing`** (5 frases + `playing_1-5.mp3` nunca se usaban) al botón Jugar (`script.js:501`).
- **Corregido el bug de auto-sueño:** cuando `energy < 15` ahora `updateIdleState()` llama a `sleep()` (recupera energía y sincroniza el mood) en lugar de solo mostrar la animación visualmente para siempre (`script.js:390`).
- **Mensaje de bienvenida:** la rama muerta (showBubble+speak sin audio) reemplazada por `say('idle')` / `say('hungry')` / `say('tired')` con voz (`script.js:1435-1444`).
- **`onNameChange`:** si el input se vacía, se restaura al nombre actual (evita desincronización, `script.js:674-682`).
- **Añadido guard de `init()`** y almacenamiento de los IDs de `setInterval` (`tickInterval`, `saveInterval`) para evitar duplicación (`script.js:229-231, 1384, 1447, 1450`).
- **Reemplazadas `querySelector` repetidas** por `els` cacheados (`spawnParticles`, `onFeedBtnClick`, `hideFoods`).
- **CSS:** eliminadas ~708 líneas muertas (selectores de partes del cuerpo del hámster que no existen en el HTML, chat, settings, AI badge, memory, speech bubble, 3D canvas, `.header h1`). Definida `--primary` (`style.css:17`). Movido el `@import` de Google Fonts a `<link>` en el HTML (`index.html:7-9`) — mejor rendimiento.
- **Accesibilidad:** añadidos 16 `aria-label` y 11 `alt`, `role=button` + `tabindex` en `#hamster`, landmark `<main>`.
- **`contexto.md`:** corregido título (Bolita→PEPE), eliminada nota stale de `petted_4/5`, eliminadas filas `inline_ai_on`/`amnesia`, IDLE ahora documenta 8 archivos, eliminada sección "Pendientes por generar".
- **`README.md`** reescrito con documentación completa en español.
- **`style.css` y `script.js`** cache-busters actualizados (`?v=20260622-1` en `index.html:11,223`).

## Limitaciones conocidas y mejoras futuras

- No hay tests automatizados ni CI.
- Los modales no se cierran con Escape ni tienen focus trap.
- Las interacciones de arrastre son solo para puntero (sin equivalente de teclado).
- No hay música de fondo ni efectos de ambiente.
- Los stats y el estado de ánimo podrían equilibrarse mejor con playtesting.
- **Futuro:** soporte de teclado para arrastres, cierre de modales con Escape, más accesorios, más frases.

## Licencia

Uso personal/familiar. No se distribuye públicamente.

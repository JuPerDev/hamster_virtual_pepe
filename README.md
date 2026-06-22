# 🐹 Pepe — Mi Hámster Virtual

Aplicación web de un hámster virtual interactivo construida con **HTML, CSS y JavaScript vanilla** (sin frameworks, sin paso de build). El hámster se llama **Pepe** y "vive" con Pepe (el papá) y sus hijas **Abby** y **Pascal**. Toda la voz está actuada en español con archivos mp3.

---

## ✨ Características

- 🌻 **Alimentación por arrastrar y soltar** — semilla, zanahoria y quesito.
- 🎾 **Juego de pelota lanzable** con física (arrastra y suelta para lanzar).
- 🛏️ **Dormir** — Pepe se hace bolita y ronrona.
- 🛁 **Limpiar** — bañito y acicalado.
- 🤗 **Acariciar** — mimos y caricias.
- 💬 **Hablar** — frases de voz en español.
- 🎩 **Gorros** y 🕶️ **lentes** arrastrables para vestirlo.
- 😊 **Estados de ánimo dinámicos** (feliz, triste, cansado, sucio, hambriento...).
- 📉 **Decaimiento de stats en tiempo real** (hambre, energía, higiene, diversión).
- 💾 **Persistencia en `localStorage`** — el estado se guarda entre sesiones.
- 🔊 **67 archivos mp3** de frases de voz en español.

> Nota: el bocadillo de texto (speech bubble) está deshabilitado a propósito; la voz es el único canal de "diálogo".

---

## 🚀 Cómo ejecutar

Al ser vanilla, basta con abrir `index.html` en un navegador moderno. No obstante, por el soporte de **ES modules** y las políticas de **autoplay de audio**, se recomienda servirlo por HTTP local.

**Opción A — servidor Python:**

```bash
python3 -m http.server 8000
```

Luego abre <http://localhost:8000>.

**Opción B — extensión Live Server de VS Code:**

Abre el proyecto en VS Code, clic derecho sobre `index.html` → **Open with Live Server**.

> 🔊 El audio requiere una interacción previa del usuario (política de autoplay del navegador). Haz clic en el botón 🔊 para activar el sonido.

---

## 📁 Estructura del proyecto

```
hamster-pet/
├── index.html          # Marcado principal
├── style.css           # Estilos y diseño
├── script.js           # Lógica del juego (módulo HamsterPet)
├── contexto.md         # Inventario de frases y sonidos
├── assets/             # SVGs (hamster 2D, gorros, lentes)
│   └── hamster_ilu/
│       ├── hamster_01.svg ...
│       ├── accesorios/  # gorros SVG
│       └── lentes/      # lentes SVG
└── sounds/             # 67 archivos mp3 de voz
```

---

## 🎮 Controles

Ocho botones de acción en la interfaz:

| Botón | Acción |
|---|---|
| 🌻 Alimentar | Arrastra la comida (semilla, zanahoria, quesito) sobre Pepe |
| 🎾 Jugar | Lanza la pelota arrastrándola y soltándola (física) |
| 🛏️ Dormir | Pepe se acuesta y duerme |
| 🛁 Limpiar | Bañito y cepillado |
| 🤗 Acariciar | Mimos |
| 💬 Hablar | Pepe dice una frase |
| 🎩 Gorros | Arrastra un gorro sobre Pepe para ponérselo |
| 🕶️ Lentes | Arrastra los lentes sobre Pepe |

Además puedes **hacer clic directamente sobre el hámster** para acariciarlo, **arrastrar alimentos** sobre él, **arrastrar y lanzar la pelota**, y **reposicionar gorros y lentes** arrastrándolos.

---

## 📌 Estado del proyecto

Proyecto personal/familiar. Funciona tal cual está. **Sin tests**, **sin CI**, sin roadmap público.

---

## 🛠️ Tecnologías

- **HTML5**
- **CSS3** — custom properties, flexbox, animaciones.
- **JavaScript** — vanilla, patrón IIFE, Pointer Events, `localStorage`, Web Audio vía elementos `<audio>`.

Sin frameworks, sin bundler, sin dependencias de npm.

---

## 📜 Licencia

Uso personal/familiar. No se distribuye públicamente.

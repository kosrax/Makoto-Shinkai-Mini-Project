<div align="center">

#  SHINKAI ARCHIVE // 新海 誠 アーカイブ

**An award-caliber, cinematic 35mm film-roll archive celebrating the filmography of Makoto Shinkai.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebGL](https://img.shields.io/badge/WebGL-Custom_Shader_Pipeline-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Performance & Architecture](#-performance--architecture) • [Customization](#-customization)

</div>

---

##  Overview

**Shinkai Archive** is an immersive digital tribute designed around the aesthetic and motion of physical 35mm celluloid film rolls. Instead of traditional rigid carousels, it maps movie stills along a continuous sinusoidal wave curve rendered directly via an interactive WebGL canvas shader, complete with film sprockets, live camera telemetry, and interactive bilingual typographic transitions.

---

##  Key Features

- ** Film Roll Carousel**
  - Smooth custom physics engine with inertia, momentum dragging, spring settling, and mouse wheel navigation.
  - Custom vertex & fragment shaders simulating the organic curves, depth perspective, and curvature of a floating film strip.
  - Perforated celluloid sprocket rails framing each movie scene.

- ** Interactive Bilingual Word-Swap (`BilingualWordSwap`)**
  - Hovering the cinematic titles seamlessly morphs text word-by-word between English and Japanese (*Kanji/Katakana*) with staggered ease transitions.

- ** Live 35mm Telemetry HUD**
  - Real-time timecode readout, aperture, shutter degree, frame rates, and reel counter synced to scroll physics.
  - Vertical *Tategaki* kanji typography column for traditional Japanese layout aesthetics.

- ** Zero-Idle GPU Optimization**
  - Intelligent RAF sleep: when the carousel settles and no hover animation is running, render cycles and draw calls pause completely (0% idle GPU / CPU usage).
  - Automatically respects user OS accessibility settings (`prefers-reduced-motion: reduce`).

- ** Fully Responsive & Touch Optimized**
  - Tuned touch gestures and drag-scrolling for mobile devices.
  - Accessible touch targets, skip-to-content keyboard links, and semantic metadata for SEO.

- ** Full Archive Index & Dossier Modal**
  - Toggle between the 3D cinematic reel and a full categorical archive view with deep film metadata, synopses, and quotes.

---

##  Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Graphics Pipeline**: Raw WebGL Canvas with GLSL Shaders
- **Icons**: [Lucide React](https://lucide.dev/)

---

##  Getting Started

### Prerequisites

Ensure you have **Node.js** (v18 or higher) and **npm** installed.

```bash
node -v
npm -v
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/shinkai-archive.git
   cd shinkai-archive
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```
   The optimized production bundle will be generated in `dist/`.

---

##  Project Structure

```text
shinkai-archive/
├── public/                 # Static assets & favicons
├── src/
│   ├── components/
│   │   ├── BilingualWordSwap.jsx   # Interactive EN ↔ JP word-by-word hover transition
│   │   ├── CornerHud.jsx           # Frame telemetry, aperture & reel index toggles
│   │   ├── CurvedCarousel.jsx      # WebGL film-roll renderer & sprocket system
│   │   ├── FullIndexView.jsx       # Grid archive view with film metadata
│   │   └── MovieModal.jsx          # Detailed cinematic dossier dialog
│   ├── data/
│   │   └── shinkaiMovies.js        # Movie entries, images, color palettes & translations
│   ├── hooks/
│   │   └── useCarouselPhysics.js   # Momentum, drag, and touch physics state machine
│   ├── app.jsx                     # Application shell, HUD orchestration & skip-link
│   └── main.jsx                    # Root entry point
├── index.html                      # Prerendered SEO fallback & viewport metadata
├── package.json
└── vite.config.js
```

---

##  Customization

You can easily adjust movies, stills, and theme colors without modifying shader or animation code:

Edit [`src/data/shinkaiMovies.js`](src/data/shinkaiMovies.js):
- **`accentColor`**: Change hex colors (e.g. `#bde0fe`, `#ffd166`) per film.
- **`image`**: Replace poster or still image URLs.
- **`title` / `japaneseTitle`**: Update English and Japanese titles used by `BilingualWordSwap`.

---

##  License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Crafted with passion for cinema and creative web development.</sub>
</div>


<h1 align="center">🌸 The "Chilling Vibe" Wedding Platform</h1>

<p align="center">
  <em>A multi-tenant, data-driven wedding website generator crafted with love, soft animations, and a deeply relaxing aesthetic.</em>
</p>

## 🍵 The "Vibe Coding" Philosophy

**"We didn't just write code; we vibed with it."** 

This repository is a product of **Vibe Coding**. The core behavior and architecture of this project were intentionally designed to evoke a "chilling vibe." What does that mean for the code?
- **Aesthetic First:** Every component is built with soft edges, glassmorphism overlays, and warm ambient shadows. 
- **Relaxing Micro-interactions:** We prioritize smooth transitions over abrupt changes. From the floating petals to the gentle spin of the vinyl music player, the UI breathes.
- **Emotional UX:** We treat the codebase as a canvas. The goal isn't just to display wedding information, but to make the guests feel the romance, nostalgia, and warmth of the couple's special day.

If you are reading this source code, put on a Lo-fi playlist, grab a cup of coffee, and enjoy the chill architecture. ☕️✨

---

## 🚀 Key Features

*   **🎭 Multi-Tenant Architecture:** Serve hundreds of couples from a single codebase. Just add `/[couple-slug]` to the URL to load entirely different data, themes, and love stories.
*   **🎨 Live Mood Presets & Theme Engine:** Switch between gorgeous predefined palettes (e.g., *Warm Sunset*, *Sage Romance*) or pick custom HEX colors in real-time.
*   **💿 Floating Vinyl Player:** An interactive, draggable record player that softly spins acoustic/lo-fi tracks in the background.
*   **📸 Polaroid Guestbook:** Guests can drop wishes and photos onto a public masonry wall, rendered as lovely tilted Polaroid cards with beating heart animations.
*   **💌 Dynamic RSVP:** A clean, data-driven RSVP form that adapts to each couple's specific requirements.
*   **✨ Framer Motion Magic:** Silky smooth scroll reveals, parallax backgrounds, and floating particles.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + CSS Variables for dynamic theming
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State Management:** React Context / Zustand
- **Deployment:** Vercel

## 📂 Data Structure (How it works)

The entire platform is powered by a central JSON database (`data/couples.json` for this mock version). The Next.js App Router reads the URL slug and fetches the corresponding object. 

Example configuration:
```json
"david-and-emma": {
  "theme": { "primaryColor": "#D4AF37", "preset": "vintage-champagne" },
  "music": "https://link-to-lofi-track.mp3",
  "events": [...],
  "guestbook": [...]
}
```

## 💻 Getting Started (Chill Setup)

Clone the repo, start the server, and watch the magic happen.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/chilling-wedding-platform.git

# 2. Enter the directory
cd chilling-wedding-platform

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000/david-and-emma](http://localhost:3000/david-and-emma) in your browser to see the magic.

## ☁️ One-Click Deploy

This project is perfectly optimized for Vercel. 

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fchilling-wedding-platform)

## 🤝 Contributing

Found a way to make the code even more aesthetic? Want to add a new romantic micro-interaction? Fork the repo and send a PR. Let's keep the good vibes going.

---
<p align="center">
  <i>Coded with 🤍 and a lot of Lo-fi.</i>
</p>

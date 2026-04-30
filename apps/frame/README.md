# Have a Break - Frame 🖼️

A premium digital photo frame and media gallery application built with Next.js, optimized for home displays and personal media curation.

## 🌟 Overview

**Have a Break - Frame** transforms your display into a living canvas. It provides a seamless, high-end experience for viewing and managing your personal media collections. Whether used on a dedicated tablet, a desktop monitor, or a smart display, the app focuses on visual excellence and intuitive interaction.

## ✨ Key Features

### 🎬 True Fullscreen Experience
The heart of the application is the Fullscreen Player. It adheres to the **True Fullscreen Principle**:
- **Edge-to-Edge**: Media covers the entire screen, eliminating distracting black bars.
- **Aspect Ratio Intelligence**: Uses high-performance CSS `object-fit: cover` to ensure a premium look across all devices.
- **Cinematic Transitions**: Smooth, high-frame-rate transitions between slides.

### 📁 Smart Media Management
- **Unified Library**: View all your images and videos in a beautiful neomorphic grid.
- **Collection Support**: Group media into thematic collections with individual settings.
- **Easy Import**: Support for bulk URL imports and local uploads.
- **Orientation Awareness**: Smart filtering and display based on media orientation (landscape, portrait, square).

### 🖐️ Premium Interactions
- **Gestural Navigation**: Swipe up or down on any media item to shrink and dismiss the lightbox—a gesture inspired by high-end mobile OS galleries.
- **Neomorphic UI**: A soft, tactile interface design that feels organic and modern.
- **Slideshow Automation**: Configurable slide intervals, auto-play, and shuffle modes.

### 🎵 Ambience
- **Background Music**: Integrated audio support for collections to create a truly immersive atmosphere.
- **Customizable Experience**: Fine-tune volume, slide duration, and display info directly from the settings panel.

## 🏗️ Technical Architecture

### Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for robust, lightweight global state.
- **Styling**: Vanilla CSS with Tailwind CSS utilities and [Neumorphism](https://en.wikipedia.org/wiki/Neumorphism) principles.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for gestural interactions and smooth transitions.
- **Media Engine**: [yet-another-react-lightbox](https://yet-another-react-lightbox.com/) with custom plugins and overrides.

### Core Components
- `MediaLightbox`: The unified base component for all media viewing, handling gestures, video playback, and slideshow logic.
- `FullscreenPlayer`: A specialized wrapper for the "Always-On" display mode with URL synchronization and background music support.
- `MediaGallery`: The management interface for browsing and curating the media library.
- `CollectionManager`: Handles the creation and modification of thematic media sets.

## 🚀 Getting Started

1. **Add Media**: Use the "Add Media" button in the gallery to import images or videos.
2. **Configure**: Open the Settings panel to adjust slide intervals and auto-play preferences.
3. **Play**: Click any media item to open the Lightbox, or click "Play" on a collection to start a fullscreen slideshow.
4. **Exit**: Swipe up/down or press Escape to return to the management view.

## 🎨 Design Philosophy

The app follows a **"Content-First"** philosophy. The UI is designed to be subtle and unobtrusive, appearing only when needed and using neomorphic shadows to feel like it's part of the physical device rather than floating on top of it.

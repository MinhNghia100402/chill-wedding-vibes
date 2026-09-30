Comprehensive Specification: Multi-Tenant Wedding Website Platform

1. Project Overview & Architecture

Act as an expert Full-Stack Developer and System Architect. Your task is to build a scalable, multi-tenant wedding website platform.
Unlike a static single-page template, this system must dynamically generate unique wedding websites for multiple couples based on a URL slug (e.g., domain.com/[couple-slug]).

The application must be completely data-driven. All text, images, event dates, and the design theme (colors and fonts) must be injected dynamically based on the couple's specific data configuration.

Key Features:

Dynamic Routing & Theming: Custom URLs and real-time Theme Switcher.

Interactive RSVP: Data-driven RSVP forms.

Digital Guestbook (NEW): An interactive section where guests can leave text wishes, upload photos, or short video clips to be displayed on a public wall.

2. Tech Stack

Framework: Next.js (App Router preferred) or React (with React Router).

State Management: React Context or Zustand.

Styling: Tailwind CSS (using CSS variables for dynamic theming).

Media Handling (For Guestbook): Implement UI for file uploads (mock the backend storage, or integrate Supabase Storage / Cloudinary if configured).

Icons: Lucide React or Heroicons.

Animations: Framer Motion (for smooth scroll reveals, page transitions, and guestbook card insertions).

3. Data Schema & Mock Database

Create a mock database (data/couples.json). The schema now includes a guestbook array to hold existing wishes, and configuration for media uploads.

Required Mock Data Structure (Example):

{
  "david-and-emma": {
    "id": "cpl_001",
    "slug": "david-and-emma",
    "theme": {
      "primaryColor": "#D4AF37", 
      "secondaryColor": "#F5F5DC", 
      "headingFont": "Playfair Display",
      "bodyFont": "Lato"
    },
    "hero": {
      "names": "David & Emma",
      "date": "2024-10-15T15:00:00Z",
      "location": "Tuscany, Italy"
    },
    "events": [
      {
        "name": "Wedding Ceremony",
        "time": "Friday, 3:00 PM",
        "locationName": "Villa Rosa",
        "address": "123 Tuscany Road",
        "mapUrl": "https://maps.google.com/..."
      }
    ],
    "guestbookConfig": {
      "allowPhotos": true,
      "allowVideos": true,
      "requireApproval": false
    },
    "guestbookEntries": [
      {
        "id": "msg_01",
        "authorName": "Uncle Bob",
        "message": "Wishing you a lifetime of happiness!",
        "mediaType": "image",
        "mediaUrl": "https://source.unsplash.com/random/400x400/?party",
        "timestamp": "2024-09-01T10:00:00Z"
      },
      {
        "id": "msg_02",
        "authorName": "Sarah & John",
        "message": "Can't wait to celebrate with you guys! So happy for you.",
        "mediaType": "text",
        "mediaUrl": null,
        "timestamp": "2024-09-02T14:30:00Z"
      }
    ],
    "rsvpConfig": {
      "deadline": "2024-09-01"
    }
  }
}


4. Dynamic Theming Engine & Live Preview

CSS Variables Strategy: Map primaryColor and secondaryColor to CSS custom properties.

Live Theme Switcher (Admin/Preview Mode): Include a floating panel with color inputs that updates the React State/Context, changing the UI in real-time.

5. UI Component Requirements

Build the following reusable components:

ThemeSwitcherPanel: A collapsible FAB for real-time color changes.

DynamicNavigation: Sticky header adapting to theme colors.

HeroSection: Full-screen hero with countdown.

EventScheduleSection: Grid of events with map links.

DigitalGuestbook (NEW):

Display Area: A Masonry grid or a horizontally scrolling carousel displaying guestbookEntries. Each card should show the author's name, message, timestamp, and render an image/video player if mediaUrl exists.

Submission Form: A stylish form with inputs for Name, Message, and a Drag-and-Drop area for File Uploads (Image/Video). For this Agent task, mock the upload process with a loading state and simulate adding a new entry to the state without needing a real backend.

RSVPForm: Dynamic form based on rsvpConfig.

6. Execution Instructions for the Agent

Initialize & Scaffold: Set up Next.js, Tailwind, and Framer Motion.

Data & State Layer: Create the mock data file and a robust Context Provider to manage both the Theme and the Guestbook Entries state (so new simulated uploads appear immediately on screen).

Routing: Build app/[slug]/page.tsx.

Build the Digital Guestbook: Pay special attention to this interactive section. The file upload UI should look modern and provide visual feedback (progress bar/spinner) before adding the card to the wall.

Implement Theme Switcher: Ensure all new components (like Guestbook cards) respect the dynamic CSS variables.

Output: Generate the complete, working code.
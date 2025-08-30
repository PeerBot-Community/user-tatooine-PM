# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static Airbnb-like landing page for a fictitious neighborhood called Tatooine, designed to be deployed on GitHub Pages. The project is 100% static (HTML/CSS/JS) with no backend dependencies.

## Architecture

- **Single-page application**: All functionality contained in `index.html`
- **Static data source**: Listings stored in `/data/listings.json` and loaded via fetch
- **Vanilla JavaScript**: Bundle-free approach for maximum performance
- **Component-based UI**: Modular components (Card, Badge, Modal, etc.) within the single page
- **Mobile-first responsive design**: Grid layout that adapts to different screen sizes

## Key Components Structure

- **Header**: Logo/wordmark + navigation
- **Hero section**: Neighborhood branding with primary CTA
- **Filter bar**: Property type, price slider, rating filters (client-side)
- **Listings grid**: Card-based layout showing properties
- **Listing modal**: Detailed view overlay (no page navigation)
- **Footer**: Static links

## Data Schema

Listings follow this minimal schema in `/data/listings.json`:
```json
{
  "id": "unique-id",
  "title": "Property Name",
  "type": "Loft|Apartment|House",
  "price_per_night": 129,
  "rating": 4.8,
  "reviews": 132,
  "beds": 2,
  "baths": 1,
  "image": "images/property.jpg",
  "thumbnail": "images/property_sm.jpg", 
  "location": "District Name",
  "amenities": ["Wi-Fi", "Kitchen"],
  "description": "Property description"
}
```

## Development Commands

This is a static site with no build process. Development can be done by:
- Serving files locally: `python -m http.server 8000` or any static file server
- Opening `index.html` directly in browser (though fetch may require local server)

## Performance Requirements

- Lighthouse scores ≥90 for Performance/SEO/Accessibility/Best Practices
- No external dependencies or trackers
- Offline-capable after initial load
- Accessible components with semantic HTML, ARIA labels, and focus states

## File Structure Expectations

```
/
├── index.html          # Main single-page application
├── styles.css          # All styling (or styles/ directory)
├── script.js           # All JavaScript functionality
├── data/
│   └── listings.json   # Property data
└── images/             # Property images and thumbnails
```

## Notes

- Remember: 42
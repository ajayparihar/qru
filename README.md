# QRU v0.1

A modern, accessible, and responsive web application for generating QR codes from text, URLs, and WiFi credentials. Developed by Bheb Developer.

[QRU Page](https://ajayparihar.github.io/qru)

[GitHub Repository](https://github.com/ajayparihar/qru)

## Features

- **Instant QR Code Generation**: Real-time generation as you type
- **Responsive & Accessible**: Works on all devices with full keyboard navigation and screen reader support
- **Dark Mode & PWA Support**: Toggle themes and install for offline use
- **Share Options**: Download, copy, or share directly
- **Smart Features**: Local storage, character counter, keyboard shortcuts
- **Simple Refresh**: Page refresh simply reloads the application

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Generate QR code
- `Esc`: Clear input
- `Ctrl/Cmd + S`: Download QR code
- `Ctrl/Cmd + Shift + C`: Copy QR code to clipboard

## Accessibility Features

- Semantic HTML structure
- ARIA attributes for dynamic content
- Focus management
- Skip to content link
- Screen reader announcements
- Keyboard navigation
- High contrast mode support
- Responsive font sizes

## Technical Details

- **Stack**: HTML5, CSS3, JavaScript (Vanilla), goqr.me API
- **APIs**: Local Storage, Web Share (with fallbacks)
- **PWA**: Service Worker, Web Manifest
- **Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge, Opera) and mobile browsers

## Installation & Development

- **Install as PWA**: Open in Chrome/Edge, click install icon in address bar
- **Local Development**: Clone the repository and open `index.html` in your browser
- **Deployment**: No build process required - deploy static files to any web server

## License

MIT
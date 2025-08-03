# App Icons for PWA

This directory should contain app icons in various sizes for the Progressive Web App.

## Required Icon Sizes:

- icon-16x16.png (favicon)
- icon-32x32.png (favicon) 
- icon-72x72.png (Android)
- icon-96x96.png (Android)
- icon-128x128.png (Android)
- icon-144x144.png (Android)
- icon-152x152.png (iOS)
- icon-167x167.png (iOS iPad)
- icon-180x180.png (iOS)
- icon-192x192.png (Android)
- icon-384x384.png (Android)
- icon-512x512.png (Android)

## How to Generate Icons:

1. Create a 512x512 master icon with your app logo
2. Use an online PWA icon generator like:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://favicon.io/

3. Or use this SVG as a starting point:

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#030213"/>
  <path d="M256 120c-44.18 0-80 35.82-80 80v20h-20c-11.05 0-20 8.95-20 20v152c0 11.05 8.95 20 20 20h200c11.05 0 20-8.95 20-20V240c0-11.05-8.95-20-20-20h-20v-20c0-44.18-35.82-80-80-80zm-40 80c0-22.09 17.91-40 40-40s40 17.91 40 40v20h-80v-20zm60 112c0 11.05-8.95 20-20 20s-20-8.95-20-20 8.95-20 20-20 20 8.95 20 20z" fill="white"/>
</svg>
```

This creates a wallet/budget app icon with a lock symbol representing security of financial data.
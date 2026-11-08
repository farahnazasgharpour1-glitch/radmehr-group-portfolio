# Radmehr Group — Architecture & Construction

A Persian (RTL), multi-page concept website for an architecture and construction brand. Built as a front-end portfolio project to demonstrate responsive layouts, visual design, and browser-native interactions.

## Live Demo

GitHub Pages deployment is configured. After the repository is made public and the first Actions deployment succeeds, the site will be available at: https://farahnazasgharpour1-glitch.github.io/radmehr-group-portfolio/

> The website is a concept/demo project, not an official company website. Project imagery and case studies are presented as design concepts; they do not claim completed construction work or real client commissions.

## Features

- Persian-first, right-to-left (RTL) interface
- Responsive layouts for desktop, tablet, and mobile
- Dark and light themes
- Architecture, interior design, construction, renovation, and project showcase pages
- Native JavaScript interactions and lightweight motion
- Reduced-motion support
- Local font, CSS, JavaScript, SVG, and WebP assets
- Contact form integration prepared with Web3Forms; real submissions must be verified on the deployed site

## Built With

- HTML5
- CSS3
- Vanilla JavaScript
- Estedad typeface (see `font/OFL.txt` for its license)

No front-end framework or runtime CDN dependency is required.

## Project Structure

```text
radmehr-group-portfolio/
├── index.html
├── html/          # About, services, projects, contact, and legal pages
├── css/           # Shared and page-specific styles
├── js/            # Browser-native interactions
├── images/        # Optimized WebP images and SVG logos
├── font/          # Estedad WOFF2 and license
├── robots.txt
├── sitemap.xml
├── 404.html
└── README.md
```

## Run Locally

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Run the root `index.html` with the Live Server extension.

Because this is a static front-end project, no package installation or build step is required.

## Notes

- The contact form uses the Web3Forms client-side endpoint. Test an actual submission after the first successful deployment before treating it as production-ready.
- The privacy page is written for the demo version and must be reviewed and completed by the site owner before collecting real visitor information.
- Performance and accessibility should be verified against the final deployed build on real devices.

## فارسی

See [README-fa.md](README-fa.md) for the Persian project notes.

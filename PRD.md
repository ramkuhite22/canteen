# Canteen 3D Web App PRD

## Objective
Transform the legacy "Canteen" project into a modern, high-performance, JSON-driven web application with an immersive Three.js-based 3D environment.

## Architecture
- **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **3D Engine:** Three.js with GSAP for animations
- **Data Layer:** Client-side architecture using structured JSON (`data.json`)
- **Methodology:** Ralph Loop autonomous iteration + OpenSpace/Ruflo multi-agent swarm

## Current Tasks
- [x] Initialize the 3D canvas and basic Three.js scene.
- [x] Bind `data.json` to the UI layer to render the sidebar navigation.
- [x] Implement self-healing schema checks for JSON data binding.
- [x] Build the interactive Dashboard view.
- [x] Add localStorage persistence for client-side data caching.
- [x] Implement Order Detail Modal (view line items, totals, client info).
- [x] Implement New Order Form (select client, add items, auto-calculate VAT, save).
- [x] Implement Add Customer modal.
- [x] Add toast notification system for feedback.
- [x] Add Delete Order functionality.
- [x] Add product search/filter in Menu view.
- [x] Enhanced Dashboard: quick stats, category breakdown bars, avg order value, top product.

## Next Tasks (Future Iterations)
- [ ] Product stock management (edit quantities from UI).
- [ ] Print/Export order as PDF.
- [ ] Charts (Chart.js) for revenue trend on dashboard.
- [ ] Date-range filter for orders.

# PROJECT_MEMORY.md

# Living Project Memory

## Project
Blockchain-Based Blood Donation Management System — **BloodChain**

## Current Stage
COMPLETE ✅

## Next Stage
—

## Completed Stages
- Stage 0 — Project initialized
- Stage 1 — Landing Page ✅
- Stage 2 — Authentication ✅
- Stage 3 — Dashboards ✅
- Stage 4 — Donor Module ✅
- Stage 5 — Blood Bank Module ✅
- Stage 6 — Hospital Module ✅
- Stage 7 — Admin Module Extensions ✅
- Stage 8 — Notifications, Reports, Polish ✅
- Stage 9 — Final QA, Deployment Prep ✅

## Reusable Components
- `Navbar.jsx` — BloodChain branded, red theme, responsive, sticky scroll
- `Footer.jsx` — 4-column footer (Platform, Portals, Technology, Brand)
- `Button` — from shared UI library (Project 1 carry-over)
- `Badge` — from shared UI library (Project 1 carry-over)

## Database Tables
- `User` — donor, bloodbank, hospital, admin roles; userId prefix DON/BBK/HSP/ADM
- `Donation` — donorId, bloodBankId, bloodType, units, status (intent/confirmed/rejected/cancelled), donationDate, confirmedAt, txHash, blockchainHash, blockNumber
- `BloodInventory` — bloodBankId, bloodType, units, minimumLevel, lastUpdated; unique index on (bloodBankId, bloodType)
- `BloodRequest` — hospitalId, bloodBankId, bloodType, units, priority (urgent/high/normal/low), status (pending/processing/fulfilled/rejected/cancelled), notes, responseNotes, fulfilledAt, txHash

## API Endpoints
- `POST /api/auth/register` — donor self-registration
- `POST /api/auth/login` — all roles
- `GET  /api/donor/stats` — totalDonations, livesImpacted, eligibility
- `GET  /api/donor/history` — donation records (empty until Stage 4)
- `GET    /api/bloodbank/stats` — totalDonationsReceived, totalInventoryUnits, pendingIntents, pendingRequests
- `GET    /api/bloodbank/inventory` — 8 blood types with units, minimumLevel, critical flag
- `PATCH  /api/bloodbank/inventory/:bloodType` — add/sub/set units + set minimumLevel
- `GET    /api/bloodbank/donations` — incoming donor intents (populated: fullName, userId, bloodType, phone)
- `PATCH  /api/bloodbank/donations/:id/confirm` — confirm; increments totalDonations; adds to inventory
- `PATCH  /api/bloodbank/donations/:id/reject` — reject with reason
- `GET    /api/bloodbank/requests` — hospital requests (populated: organizationName, state, userId)
- `PATCH  /api/bloodbank/requests/:id/fulfil` — deducts inventory, sets fulfilled
- `PATCH  /api/bloodbank/requests/:id/reject` — sets rejected with reason
- `GET    /api/bloodbank/profile` — blood bank profile
- `PATCH  /api/bloodbank/profile` — update organizationName, phone, address, state
- `GET    /api/hospital/stats` — activeRequests, fulfilledRequests, pendingRequests, connectedBanks
- `GET    /api/hospital/requests` — hospital's requests (populated: organizationName, state, userId)
- `POST   /api/hospital/requests` — create new blood request (bloodBankId, bloodType, units, priority, notes)
- `PATCH  /api/hospital/requests/:id/cancel` — cancel a pending/processing request
- `GET    /api/hospital/bloodbanks` — list all verified blood banks for selector
- `GET    /api/hospital/bloodbanks/:id/inventory` — preview bank's current stock per blood type
- `GET    /api/hospital/profile` — hospital profile
- `PATCH  /api/hospital/profile` — update organizationName, phone, address, state
- `GET    /api/admin/stats` — totalDonors, totalBloodBanks, totalHospitals, pendingVerifications, totalAudit
- `GET    /api/admin/doctors` — blood banks list
- `PATCH  /api/admin/doctors/:id` — verify/activate/deactivate blood bank
- `GET    /api/admin/hospitals` — hospitals list
- `PATCH  /api/admin/hospitals/:id` — verify/activate/deactivate hospital
- `GET    /api/admin/patients` — donors list
- `GET    /api/admin/donations` — all donations system-wide (populated: donorId, bloodBankId)
- `GET    /api/admin/requests` — all blood requests system-wide (populated: hospitalId, bloodBankId)
- `GET    /api/admin/audit` — audit log with category filter
- `GET    /api/admin/blockchain-status` — wallet status + donation counts
- `GET    /api/admin/blockchain` — on-chain txns from Donation + BloodRequest models (type filter)

## Design Tokens
Colors:
- Primary: `red-600` (#DC2626) — brand accent, CTA buttons, logo
- Text: `neutral-900` headings, `neutral-500` body, `neutral-400` muted
- Surface: `white` / `neutral-50` / `neutral-900` (dark CTA)
- Roles: red (Donor), emerald (Blood Bank), blue (Hospital), purple (Admin)
- Blockchain badge: emerald green (On-Chain verified)

Typography:
- System sans-serif throughout
- Bold tracking-tight for headings
- Monospace for technical labels (SHA-256, hash values)

Spacing:
- Section padding: `py-24`
- Container: `max-w-6xl mx-auto px-6`
- Card gap: `gap-5` / `gap-6`

Icons:
- Blood drop icon (custom SVG) for logo/brand
- All icons inline SVG, no external library

## Architecture Decisions
- Copied from tamper-proof-medical-records project, editing copy only
- Tech stack: React + Vite + Tailwind CSS (frontend), Node.js + Express (backend), MongoDB Atlas (DB), Ethereum Sepolia + Solidity (blockchain), ethers.js v6, Alchemy, Pinata + IPFS, JWT auth, Vercel + Render
- Brand name: **BloodChain**
- Primary color: red-600 replacing blue-600 from Project 1
- 4 user roles: Donor, Blood Bank, Hospital, Administrator
- Same component architecture as Project 1 (shared UI library)

## Demo Credentials
- Admin: admin@medrec.com / Admin@12345
- Donor (demo): chidi@donor.com / Donor@12345 (Blood Type: O+)
- Blood Bank: luth@bloodbank.com / BloodBank@123
- Hospital: nha@hospital.com / Hospital@123

## Stage 9 Fixes Applied
- `authController.js` — Added ACCOUNT_CREATED notification on donor register
- `bloodbankController.js` — Added notify() calls: DONATION_CONFIRMED, DONATION_REJECTED, REQUEST_FULFILLED, REQUEST_REJECTED
- `adminController.js` — Added notify() calls: BLOODBANK_VERIFIED, HOSPITAL_VERIFIED; fixed blockchain-status field names (totalRecords→totalDonations, totalAccessLogs→totalRequests)
- `AdminDashboard.jsx` — Fixed `data?.totalRecords` → `data?.totalDonations`
- `DonorDashboard.jsx` — Fixed `d.date` → `d.donationDate`, `d.bloodBank` → `d.bloodBankId?.organizationName`, added dynamic status badge
- Deployment: `server/.env.example`, `client/.env.example`, `render.yaml` created

## Known Issues
- None

## Pending Decisions
- Login page: which roles get separate tabs vs one unified login?
- Register page: Donors self-register; Blood Banks and Hospitals registered by Admin — confirm this flow

## Change Log

### Stage 0
Project initialized. PROJECT_MEMORY and PROJECT_RULES added to steve folder.

### Stage 1 — Landing Page
Files created/modified:
- `client/src/pages/Landing.jsx` — full rewrite for blood donation
- `client/src/components/layout/Navbar.jsx` — BloodChain brand, red theme
- `client/src/components/layout/Footer.jsx` — BloodChain brand, 4 portals

Sections built:
- Hero (headline, hero photo, floating badges, donor card, trust row)
- Stats (1,200+ donors, 3.5k donations, 100% integrity, 0 breaches)
- Features (6 cards: blockchain trail, SHA-256, inventory, transfers, IPFS, roles)
- Network (facility banner + 4 people cards)
- How It Works (3 steps: Register → Donate/Log → Request/Verify)
- Portals/Roles (4-column grid: Donor, Blood Bank, Hospital, Admin)
- CTA (dark section, stacked photos)
- Footer (Platform, Portals, Technology columns + copyright)

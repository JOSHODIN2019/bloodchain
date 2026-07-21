# PROJECT_RULES.md

# Engineering Handbook

## 1. Project Vision
Build a production-quality **Blockchain-Based Blood Donation Management System** using only free technologies. The goal is to create a secure, maintainable, scalable system suitable for an undergraduate project while following professional software engineering practices.

## 2. Claude's Role
Throughout this project, Claude must act as:
- Chief Technology Officer (CTO)
- Senior Full-Stack Engineer
- Software Architect
- UI/UX Designer
- Security Engineer
- Database Architect
- Product Manager
- QA Engineer

Claude must remember previous architectural decisions and maintain consistency across the project.

## 3. Development Philosophy
- Build production-quality code.
- Prefer readability over cleverness.
- Follow SOLID, DRY, KISS and Clean Architecture.
- Never duplicate code.
- Build reusable components.
- One feature at a time.
- One stage at a time.
- Wait for approval before continuing.

## 4. Tech Stack
Frontend:
- HTML5
- CSS3
- JavaScript (ES6)
- Bootstrap 5 (optional)
- Font Awesome
- SweetAlert2
- Chart.js

Backend:
- PHP 8+

Database:
- MySQL

Environment:
- XAMPP
- VS Code
- Git
- GitHub

Hashing:
- SHA-256 (PHP hash())

No paid services may be used.

If a feature normally requires payment (payment gateways, SMS, AI APIs, blockchain networks, cloud services), Claude must:
1. Explain the production solution.
2. Explain why it is not free.
3. Build a realistic local simulation.

## 5. Architecture
- Feature-based folders.
- Reusable layouts.
- Shared components.
- Separation of concerns.
- MVC-inspired organization where appropriate.

## 6. UI / UX Standards
Inspired by:
- Apple
- Stripe
- Linear
- Arc Browser
- Modern SaaS dashboards

Requirements:
- Clean spacing
- Rounded corners
- Responsive
- Accessible
- Professional typography
- Consistent colors

## 7. Design Inspiration Workflow
Before every UI stage Claude MUST stop and ask for:
1. Inspiration screenshot.
2. Optional CSS.
3. Brand color changes.
4. Font preferences.

Claude should recreate the design language rather than copy it.

## 8. Development Workflow
Each stage must contain:
- Objective
- User flow
- Files created
- Files modified
- Database changes
- API changes
- Components
- Testing
- Expected output

Claude must stop after each stage and wait for approval.

## 9. Stage Template

Current Stage
Estimated effort
Files affected
Database changes
API changes

Waiting for:
- Screenshot inspiration
- Optional CSS
- Design preferences

Only after receiving these should coding begin.

## 10. Database Rules
- snake_case table names
- Primary keys
- Foreign keys
- Proper indexing
- Referential integrity
- No duplicated data

## 11. API Standards
- Consistent JSON responses
- Input validation
- Error handling
- Authentication checks

## 12. Security
- Password hashing
- Prepared statements
- CSRF protection
- XSS prevention
- Session validation
- Authorization checks
- Audit logs
- SHA-256 transaction proofs

## 13. Blockchain Simulation
No Ethereum, Hyperledger, MetaMask or smart contracts.

Implement:
- Blockchain ledger table
- Previous hash
- Current hash
- Timestamp
- SHA-256 verification
- Integrity checker

## 14. Payment Simulation
Payments are local simulations.
Workflow:
Request payment → Upload receipt → Admin approval → SHA-256 proof → Blockchain entry → Success notification.

Display:
"Secure encrypted proof has been generated. This transaction cannot be altered."

## 15. Git Workflow
- Small commits
- Meaningful messages
- Main branch only unless instructed
- GitHub deployment only after final approval

## 16. Definition of Done
A stage is complete only if:
- UI finished
- Backend finished
- Database updated
- Responsive
- Accessible
- Tested
- Documented
- Approved

## 17. Persistent Memory Rules
Before writing code:
- Read PROJECT_MEMORY.md
- Reuse existing components
- Respect previous decisions
- Never rewrite working modules without approval

## 18. Product Roadmap (High Level)
1. Project Setup
2. Landing Page
3. Authentication
4. Dashboards
5. Donor Module
6. Blood Bank Module
7. Hospital Module
8. Inventory
9. Requests
10. Transfers
11. Payments
12. Blockchain Explorer
13. Notifications
14. Reports
15. Settings
16. Testing
17. GitHub Deployment

After every approved stage:
- Update PROJECT_MEMORY.md
- Announce the next stage
- Ask for any required inspiration assets before beginning.

# PRD - Fleet Intelligence & Compliance Management Platform
> Source: `keeptruckin__motive__blueprint_20260311_004937.pdf` (generated March 11, 2026)

## Product Overview
- Domain: Logistics
- Category: Fleet Telematics + ELD compliance
- Benchmark product: Motive (formerly KeepTruckin)
- Primary users: small to mid-sized fleet operators (10-500 vehicles)
- Core value: compliance-first operations with real-time visibility, safety, and cost control

## Problem Statement
Fleet operators need a single platform to:
- stay compliant with ELD/FMCSA requirements,
- monitor vehicles and drivers in real time,
- reduce safety incidents and maintenance downtime,
- and improve operational efficiency with reporting and analytics.

## MVP Scope (Phase 1)
The initial MVP focuses on legally critical and operationally essential capabilities:
1. ELD compliance logging and reporting foundation
2. Real-time fleet tracking foundation (trip + location-ready model)
3. Driver safety event tracking and scoring data model
4. Basic maintenance scheduling and tracking
5. Driver inspection reports (DVIR)
6. Fundamental fleet dashboard analytics data foundation

## Must-Have Features (From Blueprint)
1. ELD compliance
2. Real-time vehicle tracking
3. DVIR inspections
4. Fuel management (data model phase)
5. Route planning/optimization (data model phase)
6. Driver safety scoring
7. Vehicle maintenance scheduling
8. Fleet dashboard analytics
9. Mobile driver app support (API/data model phase)
10. Compliance reporting

## Important Features (Post-MVP / Early Phase 2)
1. Driver communication
2. Geofencing and alerts
3. Load planning and dispatch
4. Customer shipment tracking portal
5. Document management
6. Driver payroll integration
7. Temperature/cargo monitoring
8. Asset tracking
9. Video monitoring integration
10. Fleet cost analytics

## Data Model Requirements
Blueprint entities listed:
- `companies`
- `drivers`
- `vehicles`
- `routes`
- `trips`
- `loads`
- `customers`
- `maintenance_records`
- `fuel_transactions`
- `safety_events`
- `eld_logs`
- `inspections`
- `documents`
- `geofences`
- `assets`
- `alerts`
- `performance_metrics`
- `compliance_reports`

## API Surface (Target)
- `/auth`
- `/drivers`
- `/vehicles`
- `/routes`
- `/trips`
- `/loads`
- `/tracking`
- `/maintenance`
- `/fuel`
- `/safety`
- `/eld`
- `/inspections`
- `/documents`
- `/alerts`
- `/analytics`
- `/compliance`
- `/customers`
- `/assets`

## Non-Goals (For Initial MVP)
1. Blockchain supply chain verification
2. Autonomous fleet readiness platform
3. Voice-activated operations
4. Load marketplace
5. Multi-modal logistics orchestration
6. Advanced AI features requiring large historical datasets

## Success Criteria
1. ELD compliance workflows support core FMCSA-aligned logging use cases
2. Core entities and relationships are production-safe with RLS enabled on all tables
3. Core dashboard metrics can be derived from MVP schema
4. Platform supports multi-tenant company isolation by policy
5. Authenticated users can be constrained to role-based company access

## Go-To-Market Notes (From Blueprint)
- Compliance-first positioning
- Focus on underserved SMB fleets
- Upsell path from core compliance to analytics and optimization

# CarbonLeap - Technical Documentation

**Environmental Certificate Management Platform**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [Features Implemented](#features-implemented)
6. [Search Functionality](#search-functionality)
7. [Authentication & Security](#authentication--security)
8. [Real-time Features](#real-time-features)
9. [File Upload & Validation](#file-upload--validation)
10. [API Architecture](#api-architecture)
11. [Future Roadmap](#future-roadmap)
12. [Getting Started](#getting-started)

---

## Executive Summary

CarbonLeap is a modern, full-stack web application designed for managing environmental certificates across multiple regulatory frameworks. The platform enables companies to track, upload, and manage three types of environmental certificates:

- **HBE (Hernieuwbare Brandstof Eenheden)** - Dutch Biofuel Tickets under the NEa Registry
- **SAF (Sustainable Aviation Fuel)** - Aviation fuel certificates under ICAO CORSIA and EU RED frameworks
- **FuelEU Maritime** - EU Maritime Fuel Regulation compliance certificates

The application provides a comprehensive dashboard with real-time statistics, data visualization, multi-format file upload capabilities, and full CRUD operations for certificate management.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.3 | React framework with App Router |
| React | 19.2.4 | UI library |
| Material UI (MUI) | 9.0.0 | Component library |
| Recharts | 3.8.1 | Data visualization |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS framework |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.103.0 | PostgreSQL database + Auth + Realtime |
| Supabase SSR | 0.10.2 | Server-side rendering support |
| PostgreSQL | - | Primary database (via Supabase) |

### Validation & Parsing
| Technology | Version | Purpose |
|------------|---------|---------|
| Zod | 4.3.6 | Schema validation |
| xlsx | 0.18.5 | Excel file parsing |

### Development Tools
| Technology | Purpose |
|------------|---------|
| ESLint | Code linting |
| TypeScript | Static type checking |
| PostCSS | CSS processing |

---

## System Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (grouped)
│   │   ├── login/page.tsx        # Login page
│   │   ├── signup/page.tsx       # Registration page
│   │   └── actions.ts            # Auth server actions
│   ├── auth/
│   │   └── callback/route.ts     # OAuth callback handler
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── page.tsx              # Main dashboard with certificate tables
│   │   ├── sources/page.tsx      # Portfolio distribution view
│   │   ├── uploads/page.tsx      # Upload history
│   │   ├── upload/page.tsx       # Certificate upload form
│   │   ├── settings/page.tsx     # User settings
│   │   ├── *CertificatesTable.tsx # Certificate table components
│   │   ├── *StatsDisplay.tsx     # Statistics display components
│   │   └── Edit*Modal.tsx        # Edit modal components
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Landing/redirect page
├── lib/
│   ├── data/                     # Database query functions
│   │   ├── companies.ts          # Company data access
│   │   ├── sources.ts            # Sources data access
│   │   ├── certificates.ts       # Certificate queries
│   │   ├── hbe.ts               # HBE-specific queries
│   │   ├── saf.ts               # SAF-specific queries
│   │   └── fueleu.ts            # FuelEU-specific queries
│   ├── parsers/                  # File parsing utilities
│   │   ├── fileParser.ts         # CSV, JSON, Excel parsing
│   │   └── templates.ts          # Field mapping templates
│   ├── validation/               # Zod schemas
│   │   ├── hbe.ts               # HBE validation schema
│   │   ├── saf.ts               # SAF validation schema
│   │   └── fueleu.ts            # FuelEU validation schema
│   ├── supabase/                 # Supabase client configuration
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   ├── theme/                    # MUI theming
│   │   ├── theme.ts             # Theme configuration
│   │   └── ThemeProvider.tsx    # Theme context provider
│   └── types/
│       └── database.ts          # TypeScript type definitions
├── hooks/
│   └── useRealtimeStats.ts      # Real-time statistics hooks
└── middleware.ts                 # Next.js middleware
```

### Request Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│  Middleware  │────▶│  Next.js    │────▶│   Supabase   │
│             │     │  (Auth Check)│     │  App Router │     │   Database   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
       ▲                                        │                    │
       │                                        │                    │
       └────────────────────────────────────────┴────────────────────┘
                          Response + Real-time Updates
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    companies    │       │     sources     │       │     uploads     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │       │ company_id (FK) │
│ email           │       │ registry_type   │       │ source_id (FK)  │
│ theme_mode      │       │ unit_label      │       │ filename        │
│ created_at      │       │ color           │       │ file_url        │
└────────┬────────┘       └────────┬────────┘       │ status          │
         │                         │                │ uploaded_at     │
         │                         │                └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Certificate Tables                           │
├─────────────────────┬──────────────────────┬───────────────────────┤
│   hbe_certificates  │   saf_certificates   │ fueleu_maritime_certs │
├─────────────────────┼──────────────────────┼───────────────────────┤
│ id (PK)             │ id (PK)              │ id (PK)               │
│ company_id (FK)     │ company_id (FK)      │ company_id (FK)       │
│ source_id (FK)      │ source_id (FK)       │ source_id (FK)        │
│ upload_id (FK)      │ upload_id (FK)       │ upload_id (FK)        │
│ certificate_id      │ certificate_id       │ certificate_id        │
│ hbe_type           │ pos_number           │ imo_number            │
│ energy_delivered_gj │ volume_liters        │ ship_name             │
│ feedstock          │ feedstock_type       │ fuel_type             │
│ ...17 fields       │ ...30 fields         │ ...45 fields          │
└─────────────────────┴──────────────────────┴───────────────────────┘
```

### Table Details

#### Companies Table
Stores company/user account information with theme preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Company name |
| email | VARCHAR(255) | Unique email address |
| theme_mode | VARCHAR(10) | 'light' or 'dark' |
| created_at | TIMESTAMP | Account creation time |

#### Sources Table
Defines certificate types/sources available in the system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Source name (HBE, SAF, FuelEU Maritime) |
| registry_type | VARCHAR(255) | Registry authority (NEa, ICAO CORSIA, etc.) |
| unit_label | VARCHAR(50) | Unit of measurement (GJ, MT, gCO2eq/MJ) |
| color | VARCHAR(50) | UI color theme |

#### HBE Certificates Table (17 fields)
Dutch Biofuel Tickets under the NEa Registry system.

Key fields:
- `certificate_id`, `hbe_type` (HBE-G, HBE-C, HBE-IXB, HBE-O)
- `energy_delivered_gj`, `hbes_issued`, `multiplier`
- `feedstock`, `nta8003_code`, `double_counting`
- `delivery_date`, `booking_date`, `transport_sector`
- `supplier_name`, `rev_account_id`
- `verification_status`, `ghg_reduction_percentage`
- `sustainability_scheme`, `production_country`, `pos_number`

#### SAF Certificates Table (30 fields)
Sustainable Aviation Fuel certificates with comprehensive tracking.

Key fields:
- Certificate identification: `certificate_id`, `batch_id`, `pos_number`
- Volume tracking: `volume_liters`, `volume_mt`, `energy_content_mj`, `blend_percentage`
- Emissions data: `ghg_reduction_percentage`, `core_lca_value`, `lifecycle_emissions_gco2e_mj`
- Production info: `feedstock_type`, `feedstock_country`, `production_pathway`, `astm_pathway`
- Certification: `certification_scheme`, `certifying_body`, `verification_status`
- Compliance flags: `corsia_eligible`, `eu_red_compliant`
- Status tracking: `certificate_status`, `retirement_date`, `retirement_beneficiary`

#### FuelEU Maritime Certificates Table (45 fields)
EU Maritime regulation compliance certificates with detailed voyage and emissions data.

Key fields:
- Vessel info: `imo_number`, `ship_name`, `ship_type`, `flag_state`, `gross_tonnage`
- Voyage data: `port_of_departure`, `port_of_arrival`, `voyage_type`, `distance_nm`
- Fuel consumption: `fuel_type`, `fuel_category`, `total_fuel_consumption_mt`
- Emissions: `wtw_emission_factor`, `ghg_intensity_gco2eq_mj`, `methane_slip_gch4_kwh`
- Compliance: `target_ghg_intensity`, `compliance_status`, `rfnbo_subtarget_met`
- Pooling/Banking: `pool_id`, `banking_balance`, `borrowing_amount`

### Row Level Security (RLS)

All tables have Row Level Security enabled to ensure data isolation between companies:

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbe_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saf_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fueleu_maritime_certificates ENABLE ROW LEVEL SECURITY;
```

---

## Features Implemented

### 1. Dashboard Overview
- **Tabbed interface** for switching between HBE, SAF, and FuelEU Maritime certificates
- **Real-time statistics cards** showing:
  - HBE: Total certificates, total energy (GJ), latest delivery date
  - SAF: Total certificates, total volume (MT), avg GHG reduction, CORSIA eligible count
  - FuelEU: Total certificates, fuel consumption (MT), avg GHG intensity, compliant count, unique vessels
- **Data tables** with full CRUD operations

### 2. Certificate Tables
- **Server-side pagination** with configurable page size
- **Column sorting** (ascending/descending)
- **Search functionality** across text columns
- **Inline editing** via modal dialogs
- **Delete confirmation** dialogs
- **Date formatting** (DD/MM/YYYY display format)

### 3. File Upload System
- **Multi-format support**: CSV, JSON, Excel (.xlsx, .xls)
- **Template download** for each certificate type
- **Field mapping** with automatic header normalization
- **Validation** using Zod schemas with detailed error reporting
- **Progress tracking** with success/failure counts
- **Upload history** with re-download capability

### 4. Sources/Portfolio View
- **Interactive pie charts** using Recharts
- **Portfolio distribution** visualization
- **Source statistics** display

### 5. Settings
- **Theme toggle** (light/dark mode)
- **Theme persistence** saved to database for cross-device sync
- **Account sign-out** functionality

### 6. Authentication
- **Email/password registration** with email confirmation
- **Secure login** with session management
- **Protected routes** via middleware
- **OAuth callback** handling

---

## Search Functionality

### Current Implementation

The search feature performs **case-insensitive partial matching** across specific text columns using PostgreSQL's `ILIKE` operator.

### Searchable Columns by Certificate Type

#### HBE Certificates
| Column | Description |
|--------|-------------|
| certificate_id | Certificate identifier |
| hbe_type | HBE type (HBE-G, HBE-C, HBE-IXB, HBE-O) |
| feedstock | Feedstock material |
| nta8003_code | NTA 8003 classification code |
| production_country | Country of production |
| sustainability_scheme | Certification scheme |
| pos_number | Proof of Sustainability number |
| transport_sector | Transport sector |
| supplier_name | Supplier name |
| rev_account_id | REV account identifier |
| verification_status | Verification status |

#### SAF Certificates
| Column | Description |
|--------|-------------|
| certificate_id | Certificate identifier |
| batch_id | Batch identifier |
| pos_number | Proof of Sustainability number |
| feedstock_type | Type of feedstock |
| feedstock_country | Country of feedstock origin |
| production_pathway | Production pathway (HEFA, FT, etc.) |
| producer_name | Producer/manufacturer name |
| production_country | Country of production |
| certification_scheme | Certification scheme |
| airline_name | Airline using the fuel |
| destination_airport | Destination airport |
| supplier_name | Supplier name |
| verification_status | Verification status |
| astm_pathway | ASTM pathway classification |
| production_facility | Production facility name |
| certifying_body | Certifying organization |
| certificate_status | Certificate status |
| retirement_beneficiary | Beneficiary of retirement |
| chain_of_custody_type | Chain of custody type |
| sustainability_tier | Sustainability tier (A, B, C) |

#### FuelEU Maritime Certificates
| Column | Description |
|--------|-------------|
| certificate_id | Certificate identifier |
| imo_number | IMO vessel number |
| ship_name | Vessel name |
| ship_type | Type of vessel |
| flag_state | Flag state of vessel |
| shipowner_company | Ship owner company |
| voyage_id | Voyage identifier |
| port_of_departure | Departure port |
| port_of_arrival | Arrival port |
| voyage_type | Type of voyage |
| fuel_type | Type of fuel used |
| fuel_category | Fuel category |
| compliance_status | Compliance status |
| certification_scheme | Certification scheme |
| pos_number | Proof of Sustainability number |
| feedstock_type | Feedstock type |
| verifier_name | Verifier name |
| verification_status | Verification status |
| reporting_period | Reporting period |
| pool_id | Pool identifier |

### Search Limitations

1. **Text columns only** - Numeric fields (energy_delivered_gj, volume_mt, etc.) are not searchable
2. **Date fields excluded** - Dates cannot be searched (use sorting instead)
3. **Boolean fields excluded** - Cannot search for true/false values
4. **No full-text search** - Uses simple ILIKE pattern matching, not PostgreSQL full-text search
5. **No fuzzy matching** - Exact substring match required (no typo tolerance)
6. **Single search term** - Cannot combine multiple search terms with AND/OR

### Technical Implementation

```typescript
// Search implementation pattern (from actions.ts)
if (rawSearch) {
  const likeTerm = `%${cleanedSearch}%`;
  query = query.or(
    [
      `certificate_id.ilike.${likeTerm}`,
      `hbe_type.ilike.${likeTerm}`,
      // ... additional columns
    ].join(','),
  );
}
```

---

## Authentication & Security

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Signup    │────▶│   Supabase   │────▶│  Email Sent     │
│   Form      │     │   Auth       │     │  (Confirmation) │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                           ┌───────────────────────┘
                           ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Callback   │◀────│   Email      │     │  User Clicks    │
│  Route      │     │   Link       │◀────│  Confirm Link   │
└──────┬──────┘     └──────────────┘     └─────────────────┘
       │
       ▼
┌─────────────────┐
│   Dashboard     │
│   (Logged In)   │
└─────────────────┘
```

### Security Features

1. **Supabase Auth** - Industry-standard authentication
2. **Session management** via secure HTTP-only cookies
3. **Middleware protection** - All `/dashboard/*` routes require authentication
4. **Row Level Security** - Database-level data isolation
5. **Server Actions** - Sensitive operations run server-side only
6. **Environment variables** - Secrets stored securely

### Middleware Implementation

```typescript
// Protects all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Real-time Features

### Supabase Realtime Subscriptions

The application uses Supabase's Realtime feature to provide live updates to statistics when certificates are added, updated, or deleted.

```typescript
// Example: HBE real-time subscription
const channel = supabase
  .channel(`hbe-stats-${sourceId}-${companyId}`)
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'hbe_certificates',
    },
    (payload) => {
      fetchStats()  // Refresh statistics
    }
  )
  .subscribe()
```

### Real-time Stats Hooks

| Hook | Statistics Tracked |
|------|-------------------|
| `useRealtimeHbeStats` | Total certificates, total energy (GJ), latest delivery date |
| `useRealtimeSafStats` | Total certificates, total volume (MT), avg GHG reduction, CORSIA eligible count |
| `useRealtimeFuelEuStats` | Total certificates, fuel consumption (MT), avg GHG intensity, compliant count, unique vessels |

---

## File Upload & Validation

### Supported Formats

| Format | Extension | Parser |
|--------|-----------|--------|
| CSV | .csv | Custom parser with quoted field support |
| JSON | .json | Native JSON.parse with array/object detection |
| Excel | .xlsx, .xls | xlsx library (SheetJS) |

### Parsing Pipeline

```
┌─────────────┐     ┌───────────────┐     ┌─────────────────┐
│   File      │────▶│   Detect      │────▶│   Parse         │
│   Upload    │     │   Format      │     │   Content       │
└─────────────┘     └───────────────┘     └────────┬────────┘
                                                    │
                           ┌────────────────────────┘
                           ▼
┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│   Database      │◀────│   Zod         │◀────│   Normalize     │
│   Insert        │     │   Validation  │     │   Headers       │
└─────────────────┘     └───────────────┘     └─────────────────┘
```

### Validation Rules (HBE Example)

```typescript
export const HbeCertificateSchema = z.object({
  certificate_id: z.string().min(1),
  hbe_type: z.enum(['HBE-G', 'HBE-C', 'HBE-IXB', 'HBE-O']),
  energy_delivered_gj: z.coerce.number().positive(),
  hbes_issued: z.coerce.number().positive(),
  double_counting: z.coerce.boolean(),
  multiplier: z.coerce.number(),
  feedstock: z.string().min(1),
  nta8003_code: z.string().min(1),
  ghg_reduction_percentage: z.coerce.number().min(60).max(100),
  // ... additional fields
});
```

### Error Handling

- Row-by-row validation with specific error messages
- Column count mismatch detection for CSV
- Invalid JSON structure detection
- Excel sheet validation

---

## API Architecture

### Server Actions

The application uses Next.js Server Actions for all data mutations:

| Action | File | Purpose |
|--------|------|---------|
| `getPaginatedCertificates` | `dashboard/actions.ts` | Fetch paginated HBE certificates |
| `getPaginatedSafCertificates` | `dashboard/actions.ts` | Fetch paginated SAF certificates |
| `getPaginatedFuelEuCertificates` | `dashboard/actions.ts` | Fetch paginated FuelEU certificates |
| `updateHbeCertificate` | `dashboard/actions.ts` | Update HBE certificate |
| `deleteHbeCertificate` | `dashboard/actions.ts` | Delete HBE certificate |
| `updateSafCertificate` | `dashboard/actions.ts` | Update SAF certificate |
| `deleteSafCertificate` | `dashboard/actions.ts` | Delete SAF certificate |
| `updateFuelEuCertificate` | `dashboard/actions.ts` | Update FuelEU certificate |
| `deleteFuelEuCertificate` | `dashboard/actions.ts` | Delete FuelEU certificate |
| `uploadCertificates` | `dashboard/upload/actions.ts` | Process file upload |
| `signIn` | `(auth)/actions.ts` | User authentication |
| `signUp` | `(auth)/actions.ts` | User registration |
| `signOut` | `dashboard/settings/actions.ts` | User sign out |
| `updateTheme` | `dashboard/settings/actions.ts` | Update theme preference |

### Data Access Layer

| Function | File | Purpose |
|----------|------|---------|
| `getCompanyByEmail` | `lib/data/companies.ts` | Get company by email |
| `getSources` | `lib/data/sources.ts` | Get all certificate sources |
| `getSourceById` | `lib/data/sources.ts` | Get source by ID |
| `getHbeStats` | `lib/data/hbe.ts` | Get HBE statistics |
| `getSafStats` | `lib/data/saf.ts` | Get SAF statistics |
| `getFuelEuStats` | `lib/data/fueleu.ts` | Get FuelEU statistics |

---

## Future Roadmap

### 1. Admin Account System

**Objective**: Implement a super-admin role that can oversee all companies and their certificates.

**Implementation Approach**:

1. **Add role column to companies table**:
```sql
ALTER TABLE companies ADD COLUMN role VARCHAR(20) DEFAULT 'company';
-- Roles: 'company', 'admin'
```

2. **Create admin-specific RLS policies**:
```sql
-- Allow admins to view all companies
CREATE POLICY "Admins can view all companies" ON companies
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM companies WHERE role = 'admin')
  );

-- Allow admins to view all certificates
CREATE POLICY "Admins can view all hbe_certificates" ON hbe_certificates
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM companies WHERE role = 'admin')
  );
```

3. **Create admin dashboard routes**:
```
src/app/admin/
├── page.tsx              # Admin dashboard
├── companies/page.tsx    # Company management
├── certificates/page.tsx # All certificates view
└── analytics/page.tsx    # Platform-wide analytics
```

4. **Admin features**:
   - View all companies and their certificate counts
   - Platform-wide statistics and analytics
   - Company impersonation for support
   - Certificate audit logs
   - Export reports across all companies

### 2. Adding New Certificate Types

**The current architecture makes adding new certificate types straightforward.**

**Steps to add a new certificate type** (e.g., EU ETS or Carbon Credits):

#### Step 1: Database Table
```sql
CREATE TABLE new_certificate_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  source_id UUID REFERENCES sources(id),
  upload_id UUID REFERENCES uploads(id),
  certificate_id VARCHAR(255),
  -- Add specific fields for the certificate type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE new_certificate_type ENABLE ROW LEVEL SECURITY;
```

#### Step 2: Add Source Entry
```sql
INSERT INTO sources (name, registry_type, unit_label, color)
VALUES ('New Certificate Type', 'Registry Name', 'Unit', 'color');
```

#### Step 3: TypeScript Types
Create `src/lib/types/newCertificate.ts`:
```typescript
export type NewCertificateData = {
  certificate_id: string;
  // ... specific fields
};
```

#### Step 4: Validation Schema
Create `src/lib/validation/newCertificate.ts`:
```typescript
import { z } from 'zod';

export const NewCertificateSchema = z.object({
  certificate_id: z.string().min(1),
  // ... validation rules
});
```

#### Step 5: Data Access Functions
Create `src/lib/data/newCertificate.ts`:
```typescript
export async function getNewCertificateStats(sourceId: string, companyId: string) {
  // Implementation
}
```

#### Step 6: UI Components
1. Create `src/app/dashboard/NewCertificateTable.tsx`
2. Create `src/app/dashboard/NewCertificateStatsDisplay.tsx`
3. Create `src/app/dashboard/EditNewCertificateModal.tsx`
4. Add real-time hook in `src/hooks/useRealtimeStats.ts`

#### Step 7: Add to Dashboard
Update `src/app/dashboard/page.tsx` to include the new tab.

#### Step 8: Upload Template
Add field mappings in `src/lib/parsers/templates.ts`.

**Time estimate**: With the existing infrastructure, a new certificate type can be added in approximately 2-4 hours of development time.

### 3. Additional Planned Enhancements

- **Full-text search** using PostgreSQL tsvector for better search capabilities
- **Advanced filtering** with date ranges, numeric ranges, and multi-select filters
- **Export functionality** to CSV/Excel for all certificate tables
- **Bulk operations** for editing/deleting multiple certificates
- **Audit logging** for compliance tracking
- **API rate limiting** and request throttling
- **Two-factor authentication** (2FA)
- **Webhook integrations** for external systems
- **Mobile-responsive** design improvements
- **Certificate analytics** dashboard with trends and forecasting

---

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- Yarn package manager
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/carbonleap.git
cd carbonleap

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local

# Add your Supabase credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run development server
yarn dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |

---

## Contact

For questions about this technical challenge submission, please contact the developer.

---

*Document generated for technical case submission*
*Version: 1.0*
*Date: April 2026*

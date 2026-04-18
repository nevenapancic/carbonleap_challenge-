# CarbonLeap

A modern certificate management platform for tracking and managing environmental certificates including HBE (Dutch Biofuel Tickets), SAF (Sustainable Aviation Fuel), and FuelEU Maritime compliance certificates.

## Features

- **Multi-Certificate Support**: Manage three types of environmental certificates:
  - **HBE** - Dutch Biofuel Tickets (NEa Registry Netherlands)
  - **SAF** - Sustainable Aviation Fuel (ICAO CORSIA / EU RED)
  - **FuelEU Maritime** - EU Maritime Fuel Regulation compliance

- **Dashboard**: Overview of all certificates with statistics, filtering, and pagination

- **Certificate Upload**: Import certificates via CSV, JSON, or Excel files with validation and error reporting

- **Sources Overview**: Portfolio distribution visualization with interactive pie charts

- **Upload History**: Track all certificate imports with download capability

- **Dark/Light Theme**: User preference saved to database for cross-device sync

- **Authentication**: Secure login/signup with Supabase Auth

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [Material UI (MUI) v9](https://mui.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: [Recharts](https://recharts.org/)
- **File Parsing**: Custom parsers for CSV, JSON, and Excel (xlsx)
- **Validation**: [Zod](https://zod.dev/)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- Yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/carbonleap.git
cd carbonleap
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. Run the development server:
```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run these SQL commands in your Supabase SQL editor to set up the required tables:

```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  theme_mode VARCHAR(10) DEFAULT 'dark' CHECK (theme_mode IN ('light', 'dark'))
);

-- Sources table
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  registry_type VARCHAR(255),
  unit_label VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sources
INSERT INTO sources (name, registry_type, unit_label, color) VALUES
  ('HBE', 'NEa Registry', 'GJ', 'teal'),
  ('SAF', 'ICAO CORSIA', 'MT', 'coral'),
  ('FuelEU Maritime', 'EU Maritime', 'gCO2eq/MJ', 'cyan');

-- Uploads table
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  source_id UUID REFERENCES sources(id),
  filename VARCHAR(255),
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HBE Certificates table
CREATE TABLE hbe_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  source_id UUID REFERENCES sources(id),
  upload_id UUID REFERENCES uploads(id),
  certificate_id VARCHAR(255),
  hbe_type VARCHAR(100),
  energy_delivered_gj DECIMAL,
  hbes_issued INTEGER,
  double_counting BOOLEAN,
  multiplier DECIMAL,
  feedstock VARCHAR(255),
  nta8003_code VARCHAR(100),
  delivery_date DATE,
  booking_date DATE,
  transport_sector VARCHAR(100),
  supplier_name VARCHAR(255),
  rev_account_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SAF Certificates table
CREATE TABLE saf_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  source_id UUID REFERENCES sources(id),
  upload_id UUID REFERENCES uploads(id),
  certificate_id VARCHAR(255),
  pos_number VARCHAR(255),
  volume_liters DECIMAL,
  volume_mt DECIMAL,
  feedstock_type VARCHAR(255),
  feedstock_country VARCHAR(100),
  production_country VARCHAR(100),
  production_pathway VARCHAR(255),
  ghg_reduction_percentage DECIMAL,
  sustainability_scheme VARCHAR(255),
  producer_name VARCHAR(255),
  certification_scheme VARCHAR(255),
  corsia_eligible BOOLEAN,
  eu_red_compliant BOOLEAN,
  issuance_date DATE,
  delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FuelEU Maritime Certificates table
CREATE TABLE fueleu_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  source_id UUID REFERENCES sources(id),
  upload_id UUID REFERENCES uploads(id),
  certificate_id VARCHAR(255),
  imo_number VARCHAR(50),
  ship_name VARCHAR(255),
  ship_type VARCHAR(100),
  flag_state VARCHAR(100),
  gross_tonnage DECIMAL,
  shipowner_company VARCHAR(255),
  port_of_departure VARCHAR(255),
  port_of_arrival VARCHAR(255),
  departure_date DATE,
  arrival_date DATE,
  voyage_type VARCHAR(100),
  fuel_type VARCHAR(100),
  fuel_category VARCHAR(100),
  total_fuel_consumption_mt DECIMAL,
  wtw_emission_factor DECIMAL,
  ghg_intensity_gco2eq_mj DECIMAL,
  target_ghg_intensity DECIMAL,
  compliance_status VARCHAR(50),
  verification_status VARCHAR(50),
  reporting_period VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbe_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saf_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fueleu_certificates ENABLE ROW LEVEL SECURITY;
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   └── actions.ts      # Auth server actions
│   ├── dashboard/
│   │   ├── page.tsx        # Main dashboard
│   │   ├── sources/        # Sources overview with pie chart
│   │   ├── uploads/        # Upload history
│   │   ├── upload/         # Certificate upload form
│   │   ├── settings/       # User settings & theme toggle
│   │   └── [components]    # Tables, modals, stats displays
│   └── layout.tsx          # Root layout with theme provider
├── lib/
│   ├── data/               # Database queries
│   ├── parsers/            # CSV, JSON, Excel parsers
│   ├── supabase/           # Supabase client setup
│   ├── theme/              # MUI theme configuration
│   └── types/              # TypeScript types
```

## Certificate Types

### HBE (Dutch Biofuel Tickets)
- Certificate ID, HBE Type, Energy (GJ), HBEs Issued
- Feedstock, NTA8003 Code, Double Counting, Multiplier
- Delivery Date, Booking Date, Transport Sector
- Supplier Name, REV Account ID

### SAF (Sustainable Aviation Fuel)
- Certificate ID, PoS Number, Volume (Liters/MT)
- Feedstock Type & Country, Production Country & Pathway
- GHG Reduction %, Sustainability Scheme
- CORSIA Eligible, EU RED Compliant
- Producer Name, Certification Scheme

### FuelEU Maritime
- Certificate ID, IMO Number, Ship Name & Type
- Flag State, Gross Tonnage, Shipowner
- Voyage Details (Ports, Dates, Type)
- Fuel Type & Category, Consumption (MT)
- GHG Intensity, Compliance & Verification Status

## Scripts

```bash
yarn dev      # Start development server
yarn build    # Build for production
yarn start    # Start production server
yarn lint     # Run ESLint
```

## License

MIT

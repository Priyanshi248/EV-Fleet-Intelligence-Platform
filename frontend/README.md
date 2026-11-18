# EV Fleet Intelligence Platform ⚡🌿

A modern, responsive, SaaS-grade Electric Vehicle (EV) Fleet Intelligence Web Platform built with **Next.js (App Router)**, **React.js**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**.

This platform delivers comprehensive fleet monitoring, battery health intelligence, predictive maintenance, multi-criteria procurement recommendations, supply chain risk analysis, net-zero tracking, an interactive AI assistant, and full user authentication and settings management.

---

## 🔐 Complete Authentication & Access Flow

1. **First-Time Access (Protected Route Guard):**
   - When an unauthenticated user opens the website (`/`), they are automatically redirected to the **Sign In** screen.
   - Protected routes cannot be accessed without an active session.

2. **Sign In Screen (`/signin`):**
   - Work email address and password input.
   - Show/Hide password toggle.
   - **Remember Me** session checkbox.
   - **Forgot Password** recovery modal with email verification simulation.
   - **"Use Demo Login"** button for 1-click test authentication with Priyanshi's credentials.
   - Seamless link to **Sign Up**.

3. **Sign Up Screen (`/signup`):**
   - Full Name, Work Email, Password, and Confirm Password fields.
   - Show/Hide password toggle and Terms acceptance.
   - Comprehensive frontend validation (password match, minimum length, email structure).
   - Automatically establishes the session and redirects to the **Dashboard**.

4. **Sign Out:**
   - Available directly from the user profile dropdown (`PA` / Priyanshi).
   - Clears the session from `localStorage` and redirects to `/signin`.
   - Prevents unauthorized back-button or page-refresh access.

---

## ⚙️ Profile Menu Options & Dedicated Interfaces

Clicking the profile icon (`PA` / Priyanshi) opens an interactive dropdown connecting to three dedicated, fully functional screens:

1. **Account Settings (`/settings/account`):**
   - Personal & Work details: Full name, email, phone, organization, and primary depot allocation (*Delhi Central Hub*).
   - System timezone (*Asia/Kolkata IST*) and measurement units (*Metric km, kWh, °C*).
   - Avatar photo update simulation.
   - Telemetry Notification Rules: Toggles for Critical Battery Alerts, Predictive Maintenance Work Orders, Emergency SMS, and Weekly Carbon Digests.
   - Working **Save Account Settings** button with confirmation feedback banner.

2. **Security & Role Permissions (`/settings/security`):**
   - **Update Account Password** with current/new password validation.
   - **Two-Factor Authentication (TOTP)** status and reconfigure controls.
   - **Role-Based Access Control (RBAC)** team directory displaying the project sprint team (Priyanshi Agarwal, Priyanshi Saxena, Manisha, Shivanshi, and Depot Tech Lead).
   - **Active Browser & Mobile Sessions** tracker with a functional *"Revoke All Other Sessions"* action.

3. **Telemetry Preferences (`/settings/telemetry`):**
   - Ingestion protocol selection (*MQTT over TLS*, *WebSocket Secure*, *HTTP/2 REST*).
   - Vehicle gateway polling frequency (5s, 10s, 30s, 60s).
   - Interactive sliders for BMS Trigger Thresholds:
     - **Thermal Alarm (°C)** (default 45°C)
     - **Low SOC Warning (%)** (default 20%)
     - **Max Cell Voltage Delta (mV)** (default 25 mV)
   - Edge Telemetry API Token with 1-click **Copy** and **Regenerate** capabilities.
   - Working **Apply Telemetry Settings** button.

---

## 🚀 Key Modules & Pages

1. **Main Dashboard (Overview) (`/`)**
   - Welcome banner for **Priyanshi** with date badge (`Sun, 26 Oct 2026`) and eco backdrop.
   - 4 Top KPI cards: *Total Vehicles (120)*, *Average Battery SOH (92%)*, *Maintenance Alerts (8)*, and *CO₂ Savings (245 tons)*.
   - **Fleet Status Donut Chart** (In Operation: 92, Charging: 15, Maintenance: 8, Offline: 5).
   - **Monthly Energy Consumption Area Chart** with kWh and cost metrics.

2. **Fleet Monitoring (`/fleet`)**
   - Summary cards: Total, In Operation, Charging, Maintenance, Offline.
   - Search by ID/Model/Driver, Status filter, Depot filter, and **Export Fleet CSV** button.
   - Dedicated vehicle inspection drawer with **Overview**, **Battery**, **Charging**, and **Location** tabs.
   - Functional **"+ Add Vehicle"** modal allowing dynamic EV registration.

3. **Battery Intelligence (`/battery`)**
   - Vehicle selector dropdown (e.g. `EV-001 - Tata Ace EV`) and time-range toggles (`7D`, `30D`, `3M`, `1Y`).
   - SOH metric (88%), Estimated RUL (2.5 yrs / ~1,800 cycles), and Degradation Rate (0.8%/month).
   - **Run Diagnostics** button triggering real-time CAN BMS analysis with instant feedback.
   - **Battery SOH Trend Line Chart** & **Degradation Analysis (Actual vs Predicted)** chart.
   - CAN-bus parameters (Temperature 32°C, Voltage 380V, Current 12A, Cycles 1,240).

4. **Predictive Maintenance (`/maintenance`)**
   - Risk cards: Vehicles at Risk (8), High Risk (3), Medium Risk (4), Low Risk (1).
   - Search input, Risk Level dropdown, and Status filter dropdown.
   - Maintenance alerts table: Vehicle ID, Model, Risk Level, Predicted Issue, Recommendation, Status.
   - Interactive alert detail modal with root-cause diagnostics and status-updating buttons (`Pending`, `Scheduled`, `Completed`).

5. **EV Procurement Recommendations (`/procurement`)**
   - Operational requirements form (Daily Distance, Payload, Annual Mileage, Budget, Min Range, Max Charging Time).
   - Dynamic suitability scoring engine ranking commercial and passenger EVs (Tata Ace EV at 92%, Mahindra eDeliver at 87%, Tata Nexon EV at 82%).
   - Expandable procurement RFP modal with annual diesel fuel savings.

6. **Supply Chain Risk Analysis (`/supply-chain`)**
   - Multi-tab navigation: **Suppliers**, **Battery Materials**, and **Risk Factors**.
   - Global supplier table with CATL, LG Energy, Panasonic, BASF, Umicore, etc., with numeric risk badges, risk levels, and geopolitical concern notes.

7. **Net-Zero Tracking (`/net-zero`)**
   - Metric cards: CO₂ Savings (245 tons), circular Reduction Progress indicator (68%), Target Reduction (360 tons), and Planned EV replacements.
   - **Emissions Comparison Bar Chart** (Diesel Fleet vs EV Fleet from 2024 to 2028).
   - Priority replacement table with potential emissions savings and annual fuel ROI modal.

8. **AI Assistant (`/assistant`)**
   - AI bot welcome hero card with 6 clickable prompt chips.
   - Pre-loaded dialogue matching reference image with typing simulation and structured answers.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React.js 18
- **Styling:** Tailwind CSS (Navy sidebar `#0c131f`, Emerald green active highlights `#10b981`)
- **Data Visualizations:** Recharts (Donut, Area, Line, and Bar charts)
- **Icons:** Lucide React
- **Architecture:** Client-side Frontend with robust local mock authentication state

---

## 💻 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- If not logged in, you will be directed to `/signin`.
- You can log in using `priyanshi@evfleet.internal` (or click **"Use Demo Login"**).

### 3. Production Build

```bash
npm run build
npm run start
```

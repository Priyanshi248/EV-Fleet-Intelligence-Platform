// Realistic mock data for EV Fleet Intelligence Platform

export const overviewStats = {
  totalVehicles: { value: 120, change: "+12%", period: "vs last month", isPositive: true },
  avgBatterySOH: { value: "92%", change: "+3%", period: "vs last month", isPositive: true },
  maintenanceAlerts: { value: 8, change: "2 High Risk", period: "action needed", isPositive: false },
  co2Savings: { value: "245 tons", change: "+18%", period: "vs last month", isPositive: true },
};

export const fleetStatusData = [
  { name: "In Operation", value: 92, color: "#10b981", percent: "76.7%" },
  { name: "Charging", value: 15, color: "#3b82f6", percent: "12.5%" },
  { name: "Maintenance", value: 8, color: "#f97316", percent: "6.7%" },
  { name: "Offline", value: 5, color: "#94a3b8", percent: "4.1%" }
];

export const monthlyEnergyConsumption = [
  { month: "Jan", kwh: 8400, cost: "₹58,800" },
  { month: "Feb", kwh: 9100, cost: "₹63,700" },
  { month: "Mar", kwh: 9800, cost: "₹68,600" },
  { month: "Apr", kwh: 10400, cost: "₹72,800" },
  { month: "May", kwh: 11200, cost: "₹78,400" },
  { month: "Jun", kwh: 11900, cost: "₹83,300" },
  { month: "Jul", kwh: 11500, cost: "₹80,500" },
  { month: "Aug", kwh: 12100, cost: "₹84,700" },
  { month: "Sep", kwh: 11800, cost: "₹82,600" },
  { month: "Oct", kwh: 12450, cost: "₹87,150" }
];

export const initialVehicles = [
  {
    id: "EV-001",
    model: "Tata Ace EV",
    battery: 88,
    status: "In Operation",
    depot: "Delhi",
    rangeLeft: 210,
    odometer: 12450,
    consumption: 0.18,
    addedDate: "24 Oct 2026",
    type: "Cargo Mini Truck",
    driver: "Rajesh Kumar",
    soh: 88,
    rulYears: 2.5,
    rulCycles: 1800,
    temp: 32,
    voltage: 380,
    current: 12,
    chargeCycles: 1240,
    degradationRate: 0.8,
    chargingSessions: [
      { id: "CS-901", date: "26 Oct 2026 04:30 AM", energyAdded: "18.4 kWh", duration: "1h 15m", charger: "DC Fast 50kW - Depot Bay 3", startSoc: 22, endSoc: 88 },
      { id: "CS-889", date: "25 Oct 2026 05:10 AM", energyAdded: "16.8 kWh", duration: "1h 05m", charger: "DC Fast 50kW - Depot Bay 2", startSoc: 28, endSoc: 85 },
      { id: "CS-872", date: "24 Oct 2026 09:40 PM", energyAdded: "20.1 kWh", duration: "3h 20m", charger: "AC Slow 7.4kW - Bay 8", startSoc: 14, endSoc: 92 }
    ],
    telemetryHistory: [
      { time: "08:00", speed: 42, temp: 28, soc: 88, power: 14 },
      { time: "10:00", speed: 55, temp: 31, soc: 76, power: 22 },
      { time: "12:00", speed: 38, temp: 34, soc: 64, power: 18 },
      { time: "14:00", speed: 48, temp: 33, soc: 52, power: 20 },
      { time: "16:00", speed: 50, temp: 32, soc: 40, power: 21 },
      { time: "18:00", speed: 25, temp: 30, soc: 30, power: 12 }
    ]
  },
  {
    id: "EV-002",
    model: "Mahindra eDeliver",
    battery: 75,
    status: "Charging",
    depot: "Delhi",
    rangeLeft: 185,
    odometer: 18200,
    consumption: 0.22,
    addedDate: "15 Sep 2026",
    type: "Electric Cargo Van",
    driver: "Amit Sharma",
    soh: 91,
    rulYears: 3.1,
    rulCycles: 2100,
    temp: 34,
    voltage: 400,
    current: 45,
    chargeCycles: 890,
    degradationRate: 0.6,
    chargingSessions: [
      { id: "CS-902", date: "26 Oct 2026 11:20 AM", energyAdded: "24.5 kWh", duration: "45m (active)", charger: "DC Fast 60kW - Depot Bay 1", startSoc: 30, endSoc: 75 }
    ]
  },
  {
    id: "EV-003",
    model: "Tata Nexon EV",
    battery: 91,
    status: "In Operation",
    depot: "Mumbai",
    rangeLeft: 310,
    odometer: 8400,
    consumption: 0.15,
    addedDate: "02 Oct 2026",
    type: "Electric SUV",
    driver: "Pooja Verma",
    soh: 96,
    rulYears: 4.2,
    rulCycles: 2600,
    temp: 29,
    voltage: 320,
    current: 10,
    chargeCycles: 420,
    degradationRate: 0.4
  },
  {
    id: "EV-004",
    model: "BYD e6",
    battery: 42,
    status: "Maintenance",
    depot: "Bengaluru",
    rangeLeft: 120,
    odometer: 34100,
    consumption: 0.19,
    addedDate: "11 Aug 2026",
    type: "Electric MPV",
    driver: "Suresh Patil",
    soh: 82,
    rulYears: 1.8,
    rulCycles: 1100,
    temp: 48,
    voltage: 375,
    current: 18,
    chargeCycles: 1650,
    degradationRate: 1.4
  },
  {
    id: "EV-005",
    model: "Ashok Leyland EV",
    battery: 68,
    status: "In Operation",
    depot: "Chennai",
    rangeLeft: 160,
    odometer: 21300,
    consumption: 0.28,
    addedDate: "19 Jul 2026",
    type: "Heavy Delivery Van",
    driver: "Venkatesh R",
    soh: 89,
    rulYears: 2.8,
    rulCycles: 1950,
    temp: 33,
    voltage: 410,
    current: 15,
    chargeCycles: 1320,
    degradationRate: 0.7
  },
  {
    id: "EV-006",
    model: "Tata Ace EV",
    battery: 85,
    status: "In Operation",
    depot: "Delhi",
    rangeLeft: 200,
    odometer: 14200,
    consumption: 0.18,
    addedDate: "05 Aug 2026",
    type: "Cargo Mini Truck",
    driver: "Manish Tiwari",
    soh: 90,
    rulYears: 2.9,
    rulCycles: 2000,
    temp: 31,
    voltage: 382,
    current: 11,
    chargeCycles: 980,
    degradationRate: 0.6
  },
  {
    id: "EV-007",
    model: "Tata Tiago EV",
    battery: 52,
    status: "Charging",
    depot: "Pune",
    rangeLeft: 130,
    odometer: 9800,
    consumption: 0.13,
    addedDate: "14 Sep 2026",
    type: "Hatchback Utility",
    driver: "Sneha Joshi",
    soh: 94,
    rulYears: 3.8,
    rulCycles: 2400,
    temp: 30,
    voltage: 315,
    current: 30,
    chargeCycles: 510,
    degradationRate: 0.5
  },
  {
    id: "EV-008",
    model: "MG ZS EV",
    battery: 95,
    status: "In Operation",
    depot: "Delhi",
    rangeLeft: 340,
    odometer: 6700,
    consumption: 0.16,
    addedDate: "28 Sep 2026",
    type: "Electric SUV",
    driver: "Karan Johar",
    soh: 98,
    rulYears: 4.8,
    rulCycles: 2900,
    temp: 28,
    voltage: 390,
    current: 8,
    chargeCycles: 310,
    degradationRate: 0.3
  },
  {
    id: "EV-009",
    model: "Hyundai Kona",
    battery: 78,
    status: "In Operation",
    depot: "Mumbai",
    rangeLeft: 275,
    odometer: 26500,
    consumption: 0.16,
    addedDate: "12 May 2026",
    type: "Electric Crossover",
    driver: "Arjun Nair",
    soh: 87,
    rulYears: 2.4,
    rulCycles: 1600,
    temp: 32,
    voltage: 360,
    current: 14,
    chargeCycles: 1400,
    degradationRate: 0.9
  },
  {
    id: "EV-010",
    model: "Mahindra XUV400",
    battery: 34,
    status: "In Operation",
    depot: "Bengaluru",
    rangeLeft: 110,
    odometer: 19800,
    consumption: 0.17,
    addedDate: "18 Jun 2026",
    type: "Electric SUV",
    driver: "Devendra S",
    soh: 89,
    rulYears: 2.7,
    rulCycles: 1750,
    temp: 35,
    voltage: 370,
    current: 20,
    chargeCycles: 1150,
    degradationRate: 0.8
  },
  {
    id: "EV-011",
    model: "Tata Punch EV",
    battery: 65,
    status: "Maintenance",
    depot: "Delhi",
    rangeLeft: 190,
    odometer: 11200,
    consumption: 0.14,
    addedDate: "09 Aug 2026",
    type: "Compact EV",
    driver: "Deepak Yadav",
    soh: 70,
    rulYears: 1.2,
    rulCycles: 750,
    temp: 42,
    voltage: 340,
    current: 24,
    chargeCycles: 920,
    degradationRate: 1.8
  },
  {
    id: "EV-012",
    model: "Switch Mobility EiV",
    battery: 18,
    status: "Offline",
    depot: "Chennai",
    rangeLeft: 35,
    odometer: 48900,
    consumption: 0.88,
    addedDate: "10 Feb 2026",
    type: "Electric Commercial Van",
    driver: "Unassigned",
    soh: 80,
    rulYears: 1.5,
    rulCycles: 980,
    temp: 26,
    voltage: 350,
    current: 0,
    chargeCycles: 1900,
    degradationRate: 1.1
  }
];

export const batteryTrendData = [
  { month: "Jan", soh: 96, benchmark: 96 },
  { month: "Feb", soh: 95.2, benchmark: 95.3 },
  { month: "Mar", soh: 94.4, benchmark: 94.5 },
  { month: "Apr", soh: 93.5, benchmark: 93.7 },
  { month: "May", soh: 92.6, benchmark: 92.8 },
  { month: "Jun", soh: 91.8, benchmark: 92.0 },
  { month: "Jul", soh: 90.9, benchmark: 91.1 },
  { month: "Aug", soh: 90.0, benchmark: 90.3 },
  { month: "Sep", soh: 89.1, benchmark: 89.5 },
  { month: "Oct", soh: 88.0, benchmark: 88.7 }
];

export const batteryDegradationAnalysis = [
  { month: "Apr", actual: 93.5, predicted: 93.8 },
  { month: "May", actual: 92.6, predicted: 92.9 },
  { month: "Jun", actual: 91.8, predicted: 92.1 },
  { month: "Jul", actual: 90.9, predicted: 91.0 },
  { month: "Aug", actual: 90.0, predicted: 90.2 },
  { month: "Sep", actual: 89.1, predicted: 89.2 },
  { month: "Oct", actual: 88.0, predicted: 88.1 },
  { month: "Nov", actual: null, predicted: 87.2 },
  { month: "Dec", actual: null, predicted: 86.4 },
  { month: "Jan '27", actual: null, predicted: 85.5 },
  { month: "Feb '27", actual: null, predicted: 84.7 }
];

export const maintenanceStats = {
  vehiclesAtRisk: 8,
  highRisk: 3,
  mediumRisk: 4,
  lowRisk: 1
};

export const maintenanceAlerts = [
  {
    id: "ALT-101",
    vehicleId: "EV-004",
    model: "BYD e6",
    riskLevel: "High",
    predictedIssue: "Battery temperature high",
    recommendation: "Check cooling system & coolant pumps",
    status: "Pending",
    detectedDate: "26 Oct 2026",
    rootCause: "Thermal management sensor readings 14°C above baseline under 50kW charging. Potential air trap in coolant circuit.",
    recommendedAction: "Flush thermal coolant loop, inspect high-voltage relay wiring, recalibrate BMS thermocouple #3.",
    severityScore: 92
  },
  {
    id: "ALT-102",
    vehicleId: "EV-010",
    model: "Tata Punch EV",
    riskLevel: "High",
    predictedIssue: "SOH dropped to 70%",
    recommendation: "Battery inspection & cell level scan",
    status: "Pending",
    detectedDate: "25 Oct 2026",
    rootCause: "Premature capacity fade in Module 2. High internal delta (48mV) between lowest and highest cells.",
    recommendedAction: "Perform full offline static load cell test and evaluate warranty cell pack swap.",
    severityScore: 89
  },
  {
    id: "ALT-103",
    vehicleId: "EV-017",
    model: "MG ZS EV",
    riskLevel: "Medium",
    predictedIssue: "Unusual charging pattern",
    recommendation: "Check battery connectors & CC2 pin",
    status: "Scheduled",
    detectedDate: "24 Oct 2026",
    rootCause: "Intermittent charging handshake drops during CCS2 DC rapid charge sessions at Depot Bay 2.",
    recommendedAction: "Clean contact pins, inspect locking solenoid, test charging port temperature thermistor.",
    severityScore: 68
  },
  {
    id: "ALT-104",
    vehicleId: "EV-023",
    model: "Mahindra eDeliver",
    riskLevel: "Medium",
    predictedIssue: "Increased internal resistance",
    recommendation: "Cell balancing & cycle recalibration",
    status: "Pending",
    detectedDate: "23 Oct 2026",
    rootCause: "BMS impedance calculation increased by 14% over 200 cycles due to frequent fast charging.",
    recommendedAction: "Schedule 12-hour continuous AC trickle equalization charge to rebalance cells.",
    severityScore: 62
  },
  {
    id: "ALT-105",
    vehicleId: "EV-032",
    model: "Tata Nexon EV",
    riskLevel: "Medium",
    predictedIssue: "Range drop detected",
    recommendation: "Software update & BMS firmware patch",
    status: "Pending",
    detectedDate: "21 Oct 2026",
    rootCause: "Algorithmic SOC drift reported after operating in extreme ambient humidity.",
    recommendedAction: "Flash BMS firmware version 4.2.1 and perform zero-to-hundred capacity recalibration.",
    severityScore: 58
  },
  {
    id: "ALT-106",
    vehicleId: "EV-045",
    model: "Ashok Leyland EV",
    riskLevel: "Low",
    predictedIssue: "Minor degradation",
    recommendation: "Routine check during quarterly review",
    status: "Completed",
    detectedDate: "18 Oct 2026",
    rootCause: "Standard electrochemical aging consistent with 25,000 km duty cycle.",
    recommendedAction: "Verified torque specifications on traction motor mounts and tested coolant PH level.",
    severityScore: 28
  },
  {
    id: "ALT-107",
    vehicleId: "EV-008",
    model: "MG ZS EV",
    riskLevel: "Low",
    predictedIssue: "Auxiliary 12V battery low voltage",
    recommendation: "Inspect auxiliary DC-DC converter",
    status: "Scheduled",
    detectedDate: "25 Oct 2026",
    rootCause: "12V lead-acid aux battery dropping to 11.4V during overnight sleep state.",
    recommendedAction: "Top up electrolyte or swap auxiliary battery.",
    severityScore: 32
  },
  {
    id: "ALT-108",
    vehicleId: "EV-014",
    model: "Eicher Pro EV",
    riskLevel: "High",
    predictedIssue: "BMS communication timeout",
    recommendation: "Inspect CAN bus wiring & terminate resistor",
    status: "Pending",
    detectedDate: "26 Oct 2026",
    rootCause: "CAN packet loss rate exceeded 4% between Master BMS and Slave Sub-Module 4.",
    recommendedAction: "Replace shielded harness segment and test 120-ohm termination resistor.",
    severityScore: 86
  }
];

export const procurementCatalog = [
  {
    id: "PROC-01",
    model: "Tata Ace EV",
    tagline: "Suitable for your needs",
    suitabilityScore: 92,
    range: 300,
    payload: 1.2,
    chargingTime: 1.8,
    costLakh: 13.5,
    annualFuelSaving: "₹1,45,000",
    batteryCapacity: "21.3 kWh",
    warranty: "5 Years / 1,00,000 km",
    highlights: ["Best-in-class turning radius", "Rugged leaf spring suspension", "Certified IP67 waterproof powertrain"]
  },
  {
    id: "PROC-02",
    model: "Mahindra eDeliver",
    tagline: "Suitable for your needs",
    suitabilityScore: 87,
    range: 250,
    payload: 1.5,
    chargingTime: 1.5,
    costLakh: 15.0,
    annualFuelSaving: "₹1,62,000",
    batteryCapacity: "28.5 kWh",
    warranty: "6 Years / 1,50,000 km",
    highlights: ["High volume cargo container", "Dynamic regenerative braking", "Standard telematics hardware"]
  },
  {
    id: "PROC-03",
    model: "Tata Nexon EV",
    tagline: "Suitable for your needs",
    suitabilityScore: 82,
    range: 350,
    payload: 0.5,
    chargingTime: 1.2,
    costLakh: 17.0,
    annualFuelSaving: "₹1,20,000",
    batteryCapacity: "40.5 kWh",
    warranty: "8 Years / 1,60,000 km",
    highlights: ["Fast DC charging 10-80% in 56 mins", "Ziptron technology with liquid cooling", "5-Star Global NCAP safety"]
  },
  {
    id: "PROC-04",
    model: "Ashok Leyland Bada Dost EV",
    tagline: "Heavy Commercial Fit",
    suitabilityScore: 78,
    range: 220,
    payload: 2.0,
    chargingTime: 2.0,
    costLakh: 19.5,
    annualFuelSaving: "₹2,10,000",
    batteryCapacity: "35.0 kWh",
    warranty: "5 Years / 1,20,000 km",
    highlights: ["2.0 ton commercial payload", "Twin speed gearbox option", "Heavy duty dual rear wheels"]
  },
  {
    id: "PROC-05",
    model: "BYD T3 Commercial EV",
    tagline: "Urban Logistics Carrier",
    suitabilityScore: 74,
    range: 300,
    payload: 1.0,
    chargingTime: 1.4,
    costLakh: 22.0,
    annualFuelSaving: "₹1,80,000",
    batteryCapacity: "44.9 kWh (Blade)",
    warranty: "8 Years / 2,00,000 km",
    highlights: ["BYD Blade Battery chemistry", "Ultra-safe puncture resistant", "Smooth electronic drive"]
  },
  {
    id: "PROC-06",
    model: "Euler Motors HiLoad EV",
    tagline: "Hyperlocal Last Mile",
    suitabilityScore: 71,
    range: 170,
    payload: 0.7,
    chargingTime: 1.0,
    costLakh: 4.8,
    annualFuelSaving: "₹95,000",
    batteryCapacity: "12.4 kWh",
    warranty: "3 Years / 80,000 km",
    highlights: ["Low initial capital expenditure", "Liquid-cooled battery for extreme heat", "High torque hill-climb capability"]
  }
];

export const supplyChainStats = {
  suppliersAnalyzed: 12,
  highRisk: 3,
  mediumRisk: 5,
  lowRisk: 4
};

export const suppliersList = [
  {
    supplier: "CATL",
    material: "Lithium",
    country: "China",
    riskScore: 78,
    riskLevel: "High",
    keyConcerns: "Geopolitical risk, supply concentration, export control quota policies"
  },
  {
    supplier: "LG Energy",
    material: "Nickel",
    country: "South Korea",
    riskScore: 62,
    riskLevel: "Medium",
    keyConcerns: "Price volatility, raw ore price fluctuations from Indonesian export bans"
  },
  {
    supplier: "Panasonic",
    material: "Cobalt",
    country: "Japan",
    riskScore: 55,
    riskLevel: "Medium",
    keyConcerns: "Supply concentration in DRC, ethical mining audit requirements"
  },
  {
    supplier: "BASF",
    material: "Graphite",
    country: "Germany",
    riskScore: 30,
    riskLevel: "Low",
    keyConcerns: "Stable European supply chain, certified sustainable synthetic anode"
  },
  {
    supplier: "Umicore",
    material: "Manganese",
    country: "Belgium",
    riskScore: 48,
    riskLevel: "Medium",
    keyConcerns: "Environmental emissions regulations, EU chemical carbon border adjustment"
  },
  {
    supplier: "Albemarle",
    material: "Lithium Hydroxide",
    country: "USA",
    riskScore: 34,
    riskLevel: "Low",
    keyConcerns: "Stable domestic supply, Inflation Reduction Act (IRA) compliant"
  },
  {
    supplier: "Tianqi Lithium",
    material: "Lithium Carbonate",
    country: "China",
    riskScore: 74,
    riskLevel: "High",
    keyConcerns: "High tariff vulnerability, foreign investment restriction scrutiny"
  },
  {
    supplier: "Glencore",
    material: "Cobalt & Copper",
    country: "Switzerland",
    riskScore: 66,
    riskLevel: "Medium",
    keyConcerns: "Transit route volatility, maritime shipping corridor disruption"
  },
  {
    supplier: "Sumitomo Metal",
    material: "Nickel Cathodes",
    country: "Japan",
    riskScore: 42,
    riskLevel: "Low",
    keyConcerns: "Slight lead time extension due to trans-Pacific logistics"
  },
  {
    supplier: "Ganfeng Lithium",
    material: "Lithium",
    country: "China",
    riskScore: 81,
    riskLevel: "High",
    keyConcerns: "Sole source dependency, strategic export license clearance hurdles"
  }
];

export const batteryMaterialsData = [
  { name: "Lithium", share: "34%", risk: "High", avgPrice: "$24,500/ton", forecast: "+14% volatility", topCountry: "China (72% refining)" },
  { name: "Nickel", share: "28%", risk: "Medium", avgPrice: "$18,200/ton", forecast: "+6% stable", topCountry: "Indonesia / South Korea" },
  { name: "Cobalt", share: "18%", risk: "High", avgPrice: "$32,800/ton", forecast: "High geopolitical volatility", topCountry: "DR Congo (70% extraction)" },
  { name: "Graphite (Anode)", share: "12%", risk: "Low", avgPrice: "$6,100/ton", forecast: "Synthetic expanding", topCountry: "Germany / Japan" },
  { name: "Manganese", share: "8%", risk: "Medium", avgPrice: "$2,400/ton", forecast: "Moderate pricing", topCountry: "South Africa / Belgium" }
];

export const riskFactorsData = [
  { factor: "Geopolitical & Export Restrictions", weight: "35%", impact: "High", description: "Bilateral trade tariffs, rare mineral embargoes, national security list inclusions." },
  { factor: "Commodity Price Volatility", weight: "25%", impact: "High", description: "Market hedging swings, LME metal index fluctuation and foreign exchange risks." },
  { factor: "Geographic Concentration", weight: "20%", impact: "Medium", description: "Single-region refinery dependency (>60% in a single country)." },
  { factor: "ESG & Ethical Compliance", weight: "10%", impact: "Medium", description: "Carbon footprint audits, child labor prevention in raw extraction, water pollution controls." },
  { factor: "Supplier Financial Stability & Quality", weight: "10%", impact: "Low", description: "Supplier solvency, cell defect rates (<2 PPM), on-time delivery guarantees." }
];

export const netZeroStats = {
  co2Savings: "245 tons",
  co2SavingsChange: "+18%",
  reductionProgress: 68,
  targetReduction: "360 tons",
  evsPlannedReplacement: 120
};

export const emissionsComparisonData = [
  { year: "2024", dieselFleet: 310, evFleet: 280 },
  { year: "2025", dieselFleet: 245, evFleet: 185 },
  { year: "2026", dieselFleet: 190, evFleet: 105 },
  { year: "2027", dieselFleet: 130, evFleet: 55 },
  { year: "2028", dieselFleet: 85, evFleet: 20 }
];

export const topVehiclesForReplacement = [
  {
    id: "DV-101",
    model: "Tata 407 (Diesel)",
    currentEmissions: 24.5,
    potentialSavings: 20.1,
    annualFuelCost: "₹4,12,000",
    estEvCost: "₹88,000",
    netAnnualBenefit: "₹3,24,000"
  },
  {
    id: "DV-078",
    model: "Ashok Leyland (Diesel)",
    currentEmissions: 22.3,
    potentialSavings: 18.6,
    annualFuelCost: "₹3,85,000",
    estEvCost: "₹82,000",
    netAnnualBenefit: "₹3,03,000"
  },
  {
    id: "DV-065",
    model: "Tata 709 (Diesel)",
    currentEmissions: 20.1,
    potentialSavings: 16.8,
    annualFuelCost: "₹3,40,000",
    estEvCost: "₹74,000",
    netAnnualBenefit: "₹2,66,000"
  },
  {
    id: "DV-043",
    model: "Eicher Pro 2015 (Diesel)",
    currentEmissions: 18.7,
    potentialSavings: 15.2,
    annualFuelCost: "₹3,15,000",
    estEvCost: "₹69,000",
    netAnnualBenefit: "₹2,46,000"
  },
  {
    id: "DV-029",
    model: "SML Isuzu (Diesel)",
    currentEmissions: 15.4,
    potentialSavings: 12.9,
    annualFuelCost: "₹2,60,000",
    estEvCost: "₹57,000",
    netAnnualBenefit: "₹2,03,000"
  }
];

export const aiAssistantKnowledge = [
  {
    triggers: ["highest risk", "battery failure", "risk of battery", "at risk"],
    question: "Which vehicles have the highest risk of battery failure?",
    answer: `Based on the latest analysis, the following vehicles have the highest risk of battery failure:

1. **EV-004 (BYD e6)** – **High risk** (Battery temperature high, peak 48°C)
2. **EV-010 (Tata Punch EV)** – **High risk** (SOH dropped to 70%, 48mV cell delta)
3. **EV-017 (MG ZS EV)** – **Medium risk** (Unusual charging pattern, CCS2 handshake drops)

These vehicles are recommended for inspection within the next **2 weeks** to avoid roadside immobilization.`
  },
  {
    triggers: ["need maintenance", "maintenance alert", "maintenance schedule"],
    question: "Which vehicles need maintenance?",
    answer: `Currently, **8 vehicles** have active maintenance flags across the fleet:

- 🔴 **High Priority (3 vehicles):**
  - **EV-004 (BYD e6):** Coolant loop thermal warning.
  - **EV-010 (Tata Punch EV):** Rapid SOH decline to 70%.
  - **EV-014 (Eicher Pro EV):** CAN bus communication timeout between BMS modules.

- 🟡 **Medium Priority (4 vehicles):**
  - **EV-017 (MG ZS EV):** Charging connector pin resistance.
  - **EV-023 (Mahindra eDeliver):** Internal impedance rise in Module B.
  - **EV-032 (Tata Nexon EV):** Range estimation calibration drift.
  - **EV-008 (MG ZS EV):** Auxiliary 12V voltage sag.

- 🟢 **Low Priority (1 vehicle):**
  - **EV-045 (Ashok Leyland EV):** Minor wear, routine inspection completed.`
  },
  {
    triggers: ["battery health of ev-001", "ev-001", "health of ev-001"],
    question: "Explain the battery health of EV-001",
    answer: `**EV-001 (Tata Ace EV) Diagnostic Summary:**

- **State of Health (SOH):** **88%** (Optimal for 12,450 km odometer)
- **Estimated Remaining Useful Life (RUL):** **2.5 years** (~1,800 charge cycles)
- **Degradation Rate:** **0.8% / month** (Well within the normal benchmark of <1.1%/month)
- **Operating Temperature:** **32°C** (Safe thermal threshold)
- **Pack Voltage & Current:** 380V / 12A
- **Total Charge Cycles:** 1,240 cycles completed
- **Recommendation:** No service intervention needed. Continue normal DC fast & AC overnight charging.`
  },
  {
    triggers: ["200 km", "recommend evs for 200 km", "procure 200 km"],
    question: "Recommend EVs for 200 km daily route",
    answer: `For a **200 km daily commercial route**, here are the top 3 recommended vehicles:

1. 🥇 **Tata Ace EV** – **92% Suitability Score**
   - Certified Range: **300 km** (50% safety buffer over route)
   - Payload: **1.2 tons**
   - Fast Charging: **1.8 hrs** (10-80%)
   - Estimated Capital Cost: **₹13.5 Lakh**

2. 🥈 **Mahindra eDeliver** – **87% Suitability Score**
   - Certified Range: **250 km**
   - Payload: **1.5 tons**
   - Fast Charging: **1.5 hrs**
   - Estimated Capital Cost: **₹15.0 Lakh**

3. 🥉 **Tata Nexon EV** – **82% Suitability Score**
   - Certified Range: **350 km**
   - Payload: **0.5 tons** (Passenger/Courier only)
   - Cost: **₹17.0 Lakh**`
  },
  {
    triggers: ["supply chain", "supply chain risk", "supplier risk"],
    question: "Show supply chain risks",
    answer: `**Key Supply Chain Risk Insights:**

- **12 Global Suppliers Analysed:**
  - 🔴 **3 High-Risk Suppliers:** CATL (Lithium, China - Risk Score 78), Tianqi Lithium (China - 74), Ganfeng Lithium (China - 81).
  - 🟡 **5 Medium-Risk Suppliers:** LG Energy (Nickel, South Korea - 62), Glencore (Cobalt, Switzerland - 66), Panasonic (Cobalt, Japan - 55).
  - 🟢 **4 Low-Risk Suppliers:** BASF (Graphite, Germany - 30), Albemarle (USA - 34).

- **Critical Bottleneck:** Over **72% of battery-grade lithium refining** remains concentrated in China, creating exposure to prospective export quotas and shipping tariffs.`
  },
  {
    triggers: ["how much co2", "co2 can we save", "emissions", "carbon"],
    question: "How much CO₂ can we save?",
    answer: `**Fleet Decarbonization & Net-Zero Impact:**

- **Current Cumulative Savings:** **245 tons CO₂** achieved to date (+18% YoY).
- **Target Savings:** **360 tons CO₂** by Q4 2027 (currently at **68% of milestone**).
- **Immediate Replacement Opportunity:**
  Replacing the top 5 heavy diesel polluters (**DV-101 Tata 407, DV-078 Ashok Leyland, DV-065 Tata 709, DV-043 Eicher, DV-029 SML**) will reduce fleet greenhouse gas emissions by an additional **83.6 tons CO₂/year** while generating over **₹13.4 Lakhs in annual diesel fuel savings**.`
  },
  {
    triggers: ["compare tata ace", "ace ev vs", "compare"],
    question: "Compare Tata Ace EV vs eDeliver",
    answer: `**Head-to-Head Comparison:**

| Feature | Tata Ace EV | Mahindra eDeliver | Winner |
| :--- | :--- | :--- | :--- |
| **Certified Range** | 300 km | 250 km | 🟢 Tata Ace EV (+50 km) |
| **Payload Capacity** | 1.2 tons | 1.5 tons | 🟢 Mahindra eDeliver (+300 kg) |
| **Fast Charge Time** | 1.8 hrs | 1.5 hrs | 🟢 Mahindra eDeliver (18 min faster) |
| **Estimated Price** | ₹13.5 Lakh | ₹15.0 Lakh | 🟢 Tata Ace EV (₹1.5L more economical) |
| **Battery Chemistry**| LFP Liquid-cooled | NMC Advanced | Tie (LFP has longer lifespan) |
| **Overall Suitability**| **92%** | **87%** | **Tata Ace EV** (Best all-rounder) |`
  }
];


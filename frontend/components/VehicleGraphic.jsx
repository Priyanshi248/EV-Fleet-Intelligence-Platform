'use client';

export default function VehicleGraphic({ type = "truck", className = "w-full h-36" }) {
  if (type === "truck" || type === "Tata Ace EV") {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-xl p-4 overflow-hidden border border-slate-100 ${className}`}>
        <svg viewBox="0 0 280 150" className="w-full h-full max-h-36 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground shadow */}
          <ellipse cx="140" cy="138" rx="110" ry="8" fill="#cbd5e1" opacity="0.6" />
          
          {/* Cargo Container (White Box with corrugated ribs) */}
          <rect x="110" y="30" width="135" height="78" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          {/* Container roof rail */}
          <rect x="108" y="26" width="139" height="5" rx="2" fill="#64748b" />
          {/* Corrugation lines */}
          <line x1="135" y1="32" x2="135" y2="106" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="160" y1="32" x2="160" y2="106" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="185" y1="32" x2="185" y2="106" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="210" y1="32" x2="210" y2="106" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="230" y1="32" x2="230" y2="106" stroke="#e2e8f0" strokeWidth="2" />
          {/* Green EV Eco Leaf Decal on box */}
          <circle cx="170" cy="62" r="14" fill="#ecfdf5" />
          <path d="M165 67 C165 58, 175 56, 177 56 C177 64, 172 68, 165 67 Z" fill="#10b981" />
          <text x="190" y="66" fill="#059669" fontSize="9" fontWeight="bold" fontFamily="sans-serif">EV 100%</text>

          {/* Truck Cab */}
          <path d="M45 108 L45 78 C45 68 52 52 68 46 L95 44 C104 44 110 50 110 58 L110 108 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          {/* Windshield */}
          <path d="M56 74 L68 52 C70 48 76 46 84 46 L104 46 L104 74 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#64748b" strokeWidth="1.5" />
          {/* Side window */}
          <path d="M82 52 L103 52 L103 74 L82 74 Z" fill="#0284c7" fillOpacity="0.3" stroke="#64748b" strokeWidth="1" />
          {/* Headlight */}
          <rect x="42" y="86" width="6" height="12" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          {/* Front Bumper */}
          <rect x="38" y="98" width="16" height="12" rx="3" fill="#334155" />
          {/* Door Handle */}
          <rect x="90" y="80" width="8" height="2" rx="1" fill="#64748b" />

          {/* Chassis Frame */}
          <rect x="52" y="106" width="190" height="8" rx="2" fill="#1e293b" />
          {/* Battery Pack Underneath (Green Highlight) */}
          <rect x="105" y="108" width="65" height="8" rx="2" fill="#10b981" />
          <text x="114" y="115" fill="#ffffff" fontSize="6" fontWeight="bold">BATTERY PACK</text>

          {/* Front Wheel */}
          <circle cx="78" cy="116" r="16" fill="#0f172a" stroke="#475569" strokeWidth="3" />
          <circle cx="78" cy="116" r="8" fill="#e2e8f0" />
          <circle cx="78" cy="116" r="3" fill="#0f172a" />

          {/* Rear Wheel (Dual axle) */}
          <circle cx="215" cy="116" r="16" fill="#0f172a" stroke="#475569" strokeWidth="3" />
          <circle cx="215" cy="116" r="8" fill="#e2e8f0" />
          <circle cx="215" cy="116" r="3" fill="#0f172a" />
        </svg>
      </div>
    );
  }

  if (type === "van" || type === "Mahindra eDeliver") {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-xl p-4 overflow-hidden border border-slate-100 ${className}`}>
        <svg viewBox="0 0 280 150" className="w-full h-full max-h-36 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="140" cy="138" rx="110" ry="8" fill="#cbd5e1" opacity="0.6" />
          
          {/* Van Body */}
          <path d="M45 106 L45 80 C45 68 54 54 75 48 L170 46 C210 46 240 54 245 74 L245 106 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          {/* Front Windshield */}
          <path d="M56 74 L75 52 C80 49 90 48 100 48 L108 48 L108 74 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#64748b" strokeWidth="1.5" />
          {/* Driver Window */}
          <rect x="114" y="52" width="35" height="22" rx="2" fill="#0284c7" fillOpacity="0.3" stroke="#64748b" strokeWidth="1" />
          {/* Cargo Side Panel Accent */}
          <path d="M160 52 L230 52 C234 52 238 56 238 60 L238 98 L160 98 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          
          {/* Green Electric Lightning Stripe */}
          <path d="M170 75 L190 75 L182 86 L198 86 L178 102 L183 91 L170 91 Z" fill="#10b981" />
          <text x="202" y="85" fill="#059669" fontSize="9" fontWeight="bold">eDELIVER</text>

          {/* Front Bumper & Light */}
          <rect x="40" y="96" width="10" height="12" rx="2" fill="#334155" />
          <circle cx="46" cy="85" r="4" fill="#facc15" />

          {/* Wheels */}
          <circle cx="82" cy="116" r="16" fill="#0f172a" stroke="#475569" strokeWidth="3" />
          <circle cx="82" cy="116" r="8" fill="#e2e8f0" />
          <circle cx="205" cy="116" r="16" fill="#0f172a" stroke="#475569" strokeWidth="3" />
          <circle cx="205" cy="116" r="8" fill="#e2e8f0" />
        </svg>
      </div>
    );
  }

  // SUV / Car (e.g. Tata Nexon EV)
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-xl p-4 overflow-hidden border border-slate-100 ${className}`}>
      <svg viewBox="0 0 280 150" className="w-full h-full max-h-36 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="140" cy="138" rx="100" ry="7" fill="#cbd5e1" opacity="0.6" />
        
        {/* Car Body - Aerodynamic Teal/Blue-Silver or White */}
        <path d="M42 104 L44 90 C46 84 52 78 62 76 L86 68 L120 48 C135 44 175 44 195 50 L226 70 L242 82 C248 86 250 92 250 98 L250 106 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        {/* Roof line dual-tone */}
        <path d="M110 50 C125 45 180 45 200 52 L225 70 L115 70 Z" fill="#0f172a" />
        {/* Windows */}
        <path d="M96 68 L122 52 L155 52 L155 68 Z" fill="#7dd3fc" fillOpacity="0.5" stroke="#38bdf8" />
        <path d="M162 52 L192 52 L215 68 L162 68 Z" fill="#7dd3fc" fillOpacity="0.5" stroke="#38bdf8" />

        {/* LED Headlight & Taillight */}
        <path d="M44 88 L54 88 L50 94 L42 94 Z" fill="#fef08a" />
        <path d="M246 88 L250 88 L250 94 L244 94 Z" fill="#ef4444" />

        {/* Aerodynamic Door Line & Green Accent */}
        <line x1="80" y1="92" x2="210" y2="92" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="150" cy="80" r="1.5" fill="#ffffff" />
        <circle cx="185" cy="80" r="1.5" fill="#ffffff" />

        {/* Wheels with Sport EV Rims */}
        <circle cx="82" cy="114" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="82" cy="114" r="7" fill="#64748b" />
        <circle cx="210" cy="114" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="210" cy="114" r="7" fill="#64748b" />
      </svg>
    </div>
  );
}


"""
ai_explainer.py
===============
AI Assistant Service for EV Fleet Intelligence Platform.

Generates structured executive explanations for:
  1. Why a specific EV was recommended
  2. Key supply chain risks tied to its battery chemistry
  3. Concrete mitigation steps for the fleet manager

Supports three modes (auto-detected at runtime):
  - Mode A: Google Gemini API    (if GEMINI_API_KEY is set in environment)
  - Mode B: OpenAI API           (if OPENAI_API_KEY is set in environment)
  - Mode C: Fallback Mock Engine (if no API key is configured — always works)
"""

import os
import json
from typing import Optional
from datetime import datetime

# ---------------------------------------------------------------------------
# Environment Key Detection
# ---------------------------------------------------------------------------

GEMINI_API_KEY: Optional[str] = os.environ.get("GEMINI_API_KEY")
OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")


def _detect_llm_mode() -> str:
    """
    Detects which LLM backend is available based on environment variables.

    Returns:
        str: "gemini" | "openai" | "mock"
    """
    if GEMINI_API_KEY:
        return "gemini"
    if OPENAI_API_KEY:
        return "openai"
    return "mock"


# ---------------------------------------------------------------------------
# Prompt Builder
# ---------------------------------------------------------------------------

def _build_system_prompt() -> str:
    return (
        "You are an expert EV Fleet Procurement and Supply Chain Risk Analyst "
        "advising a fleet operations manager. "
        "Your explanations must be clear, factual, and actionable. "
        "Always structure your response in three clearly labelled sections: "
        "1. Recommendation Rationale, "
        "2. Supply Chain Risk Assessment, "
        "3. Mitigation Action Plan. "
        "Use plain English. Avoid jargon. Keep the total response under 400 words."
    )


def _build_user_prompt(
    vehicle_make: str,
    vehicle_model: str,
    vehicle_category: str,
    battery_chemistry: str,
    suitability_score: float,
    range_buffer_pct: float,
    payload_margin_kg: float,
    tco_5yr_usd: float,
    cost_per_km_usd: float,
    charging_window_utilization_pct: float,
    supplier_risk_score: float,
    supplier_risk_category: str,
    primary_risk_driver: str,
    co2_saved_tonnes_yr: float,
    co2_reduction_pct: float,
    carbon_abatement_cost_usd: float,
    cac_verdict: str,
    grid_region: str,
    fleet_size: int,
    payback_years: float,
) -> str:
    return f"""
You have been given the following computed metrics for a fleet electrification decision.

=== VEHICLE RECOMMENDATION ===
Vehicle           : {vehicle_make} {vehicle_model} ({vehicle_category})
Battery Chemistry : {battery_chemistry}
Suitability Score : {suitability_score}/100
Range Buffer      : +{range_buffer_pct}% above daily requirement
Payload Margin    : +{payload_margin_kg} kg above required
5-Year TCO        : ${tco_5yr_usd:,.0f}
Cost per km       : ${cost_per_km_usd:.4f}/km
Charging Window   : {charging_window_utilization_pct:.1f}% of available shift window used

=== SUPPLY CHAIN RISK ===
Composite Risk Score    : {supplier_risk_score}/100 ({supplier_risk_category})
Primary Risk Driver     : {primary_risk_driver.replace("_", " ").title()}
Battery Chemistry       : {battery_chemistry} (determines which raw materials are needed)

=== CARBON & NET-ZERO IMPACT ===
Grid Region             : {grid_region}
CO2 Saved per vehicle   : {co2_saved_tonnes_yr:.2f} tonnes/year
Fleet CO2 Reduction     : {co2_reduction_pct:.1f}% across {fleet_size} vehicles
Carbon Abatement Cost   : ${carbon_abatement_cost_usd:.2f}/tonne CO2
Abatement Verdict       : {cac_verdict}
Investment Payback      : {payback_years:.1f} years

=== YOUR TASK ===
Using ONLY the data above, write an executive briefing with exactly three sections:

**1. Recommendation Rationale**
Explain in 3-4 sentences why this specific vehicle was recommended over alternatives,
referencing the suitability score, range buffer, payload margin, and TCO.

**2. Supply Chain Risk Assessment**
Explain in 3-4 sentences the key supply chain risks associated with the {battery_chemistry}
battery chemistry, what the primary risk driver ({primary_risk_driver.replace("_", " ").title()}) means
in practice, and how severe the {supplier_risk_category} rating is.

**3. Mitigation Action Plan**
Provide exactly 4 concrete, numbered action steps the fleet manager should take
to mitigate the supply chain risk and maximise the carbon reduction opportunity.
""".strip()


# ---------------------------------------------------------------------------
# Mode A: Google Gemini
# ---------------------------------------------------------------------------

def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    """
    Calls the Google Gemini API to generate an explanation.
    Requires: pip install google-generativeai
    """
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_prompt,
        )
        response = model.generate_content(user_prompt)
        return response.text.strip()
    except ImportError:
        raise RuntimeError(
            "google-generativeai package is not installed. "
            "Run: pip install google-generativeai"
        )
    except Exception as e:
        raise RuntimeError(f"Gemini API call failed: {str(e)}")


# ---------------------------------------------------------------------------
# Mode B: OpenAI
# ---------------------------------------------------------------------------

def _call_openai(system_prompt: str, user_prompt: str) -> str:
    """
    Calls the OpenAI Chat Completions API to generate an explanation.
    Requires: pip install openai
    """
    try:
        from openai import OpenAI  # type: ignore
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=600,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip()
    except ImportError:
        raise RuntimeError(
            "openai package is not installed. Run: pip install openai"
        )
    except Exception as e:
        raise RuntimeError(f"OpenAI API call failed: {str(e)}")


# ---------------------------------------------------------------------------
# Mode C: Fallback Mock Engine (no API key needed)
# ---------------------------------------------------------------------------

CHEMISTRY_RISK_DESCRIPTIONS: dict[str, dict] = {
    "LFP": {
        "materials":    "iron and phosphate",
        "risk_note":    "China controls ~88% of iron phosphate (LFP precursor) production, creating concentration risk.",
        "advantage":    "LFP chemistry offers superior thermal stability, longer cycle life (~3,000 cycles), and lower fire risk compared to NMC.",
        "mitigation":   "Diversify to phosphate suppliers in Morocco or the US to reduce single-country dependency.",
    },
    "NMC": {
        "materials":    "nickel, manganese, and cobalt",
        "risk_note":    "Cobalt sourcing is the critical bottleneck — the DR Congo supplies ~74% of global cobalt, with high geopolitical and ESG risks.",
        "advantage":    "NMC offers higher energy density, enabling longer nominal range, but comes with higher supply chain complexity.",
        "mitigation":   "Prioritise suppliers with certified cobalt-free or reduced-cobalt NMC variants and demand third-party ESG audits.",
    },
    "NCA": {
        "materials":    "nickel, cobalt, and aluminium",
        "risk_note":    "NCA relies heavily on high-purity nickel and cobalt, both subject to price volatility and geographic concentration.",
        "advantage":    "NCA provides high power density suitable for performance applications, but has shorter cycle life (~1,200 cycles).",
        "mitigation":   "Establish forward contracts for nickel supply and explore battery-as-a-service models to shift material risk to the OEM.",
    },
}


def _risk_driver_explanation(driver: str) -> str:
    """Returns a plain-English description of the primary risk driver."""
    explanations = {
        "geopolitical_risk":          "the country of origin has political instability, trade sanctions, or export restriction risks that could disrupt supply",
        "price_volatility_risk":      "commodity prices for this material have shown high historical variance, making long-term procurement budgeting unpredictable",
        "supplier_concentration_hhi": "a small number of suppliers control the majority of market supply, creating single-point-of-failure risk",
        "quality_defect_ppm":         "elevated defect rates have been recorded, which can affect battery cell performance and warranty liability",
        "esg_sustainability_score":   "the supplier scores poorly on environmental, social, and governance metrics, creating regulatory and reputational risk",
    }
    return explanations.get(driver, "this risk factor requires further investigation")


def _generate_mock_explanation(
    vehicle_make: str,
    vehicle_model: str,
    vehicle_category: str,
    battery_chemistry: str,
    suitability_score: float,
    range_buffer_pct: float,
    payload_margin_kg: float,
    tco_5yr_usd: float,
    cost_per_km_usd: float,
    charging_window_utilization_pct: float,
    supplier_risk_score: float,
    supplier_risk_category: str,
    primary_risk_driver: str,
    co2_saved_tonnes_yr: float,
    co2_reduction_pct: float,
    carbon_abatement_cost_usd: float,
    cac_verdict: str,
    grid_region: str,
    fleet_size: int,
    payback_years: float,
) -> str:
    """
    Generates a structured executive explanation without any LLM API call.
    Uses template logic driven entirely by computed data inputs.
    Always works — no internet, no API key required.
    """
    chem = battery_chemistry.upper()
    chem_info = CHEMISTRY_RISK_DESCRIPTIONS.get(
        chem,
        {
            "materials":  "various critical minerals",
            "risk_note":  "battery material supply chains carry inherent concentration and geopolitical risks.",
            "advantage":  "this chemistry meets the operational requirements specified.",
            "mitigation": "conduct a full supply chain audit and establish dual sourcing strategies.",
        }
    )

    driver_plain = primary_risk_driver.replace("_", " ").title()
    driver_explanation = _risk_driver_explanation(primary_risk_driver)

    # Score narrative
    if suitability_score >= 80:
        score_narrative = f"an outstanding suitability score of {suitability_score}/100, placing it in the top tier of evaluated candidates"
    elif suitability_score >= 60:
        score_narrative = f"a strong suitability score of {suitability_score}/100, comfortably meeting all operational requirements"
    else:
        score_narrative = f"an acceptable suitability score of {suitability_score}/100 — the best available match for these specific requirements"

    # CAC narrative
    if carbon_abatement_cost_usd < 0:
        cac_narrative = f"the electrification is immediately cost-saving (negative abatement cost of ${carbon_abatement_cost_usd:,.0f}/tonne), meaning the EV is cheaper to operate AND cleaner"
    elif carbon_abatement_cost_usd <= 150:
        cac_narrative = f"the abatement cost of ${carbon_abatement_cost_usd:,.0f}/tonne is well within typical carbon market pricing, making this investment commercially attractive"
    else:
        cac_narrative = f"the abatement cost of ${carbon_abatement_cost_usd:,.0f}/tonne is above typical carbon credit prices; subsidies or green fleet incentives should be explored to close the gap"

    explanation = f"""
**1. Recommendation Rationale**

The {vehicle_make} {vehicle_model} ({vehicle_category}) was selected with {score_narrative}. It delivers a {range_buffer_pct:.1f}% range buffer above the daily operational requirement under real-world temperature and payload conditions, providing {payload_margin_kg:.0f} kg of additional payload capacity beyond what is needed. Over a 5-year horizon, its total cost of ownership of ${tco_5yr_usd:,.0f} (${cost_per_km_usd:.3f}/km) represents strong economic value. The vehicle's {battery_chemistry} battery chemistry also supports the charging requirement, using only {charging_window_utilization_pct:.1f}% of the available shift window.

---

**2. Supply Chain Risk Assessment**

The {vehicle_make} {vehicle_model} uses {chem} battery chemistry, which depends on {chem_info["materials"]}. {chem_info["risk_note"]} The current composite supply chain risk score is {supplier_risk_score}/100, categorised as **{supplier_risk_category}**. The primary risk driver is **{driver_plain}**, meaning {driver_explanation}. {chem_info["advantage"]} Fleet managers should treat this as an ongoing risk to monitor, particularly as global demand for EV batteries is projected to increase 5–10x by 2030.

---

**3. Mitigation Action Plan**

1. **Diversify Supplier Base**: Avoid single-supplier dependency by onboarding at least two qualified battery material suppliers from different geographies. {chem_info["mitigation"]}

2. **Establish Strategic Material Reserves**: Work with your procurement team to hold 60–90 days of critical battery material inventory or negotiate forward contracts to buffer against price spikes (current price volatility is factored into the {supplier_risk_category} rating).

3. **Accelerate Fleet Electrification**: Replacing {fleet_size} diesel vehicles on the {grid_region} electricity grid saves {co2_saved_tonnes_yr:.1f} tonnes of CO2 per vehicle per year — a {co2_reduction_pct:.1f}% reduction. {cac_narrative}. The investment payback period is {payback_years:.1f} years.

4. **Commission Annual ESG Supplier Audits**: Require all battery material and cell suppliers to submit third-party ESG audit reports annually. Prioritise suppliers with ISO 14001 environmental certification and transparent conflict-mineral disclosure to reduce regulatory and reputational risk.
""".strip()

    return explanation


# ---------------------------------------------------------------------------
# Main Public Function
# ---------------------------------------------------------------------------

def generate_ai_explanation(
    # Vehicle recommendation data
    vehicle_make: str,
    vehicle_model: str,
    vehicle_category: str,
    battery_chemistry: str,
    suitability_score: float,
    range_buffer_pct: float,
    payload_margin_kg: float,
    tco_5yr_usd: float,
    cost_per_km_usd: float,
    charging_window_utilization_pct: float,
    # Supplier risk data
    supplier_risk_score: float,
    supplier_risk_category: str,
    primary_risk_driver: str,
    # Carbon savings data
    co2_saved_tonnes_yr: float,
    co2_reduction_pct: float,
    carbon_abatement_cost_usd: float,
    cac_verdict: str,
    grid_region: str,
    fleet_size: int,
    payback_years: float,
) -> dict:
    """
    Main entry point for the AI Assistant.

    Automatically selects the best available LLM backend:
      - Google Gemini  (if GEMINI_API_KEY env var is set)
      - OpenAI         (if OPENAI_API_KEY env var is set)
      - Mock Engine    (fallback — always works with no API key)

    Args:
        All arguments are computed metrics from the three service engines.

    Returns:
        dict: {
            "explanation":    Full markdown-formatted executive explanation,
            "mode":           Which engine was used (gemini/openai/mock),
            "generated_at":   ISO timestamp,
            "vehicle":        Brief vehicle identifier,
            "risk_category":  Supplier risk band,
            "co2_impact":     Net CO2 savings summary,
        }
    """
    mode = _detect_llm_mode()

    system_prompt = _build_system_prompt()
    user_prompt   = _build_user_prompt(
        vehicle_make=vehicle_make,
        vehicle_model=vehicle_model,
        vehicle_category=vehicle_category,
        battery_chemistry=battery_chemistry,
        suitability_score=suitability_score,
        range_buffer_pct=range_buffer_pct,
        payload_margin_kg=payload_margin_kg,
        tco_5yr_usd=tco_5yr_usd,
        cost_per_km_usd=cost_per_km_usd,
        charging_window_utilization_pct=charging_window_utilization_pct,
        supplier_risk_score=supplier_risk_score,
        supplier_risk_category=supplier_risk_category,
        primary_risk_driver=primary_risk_driver,
        co2_saved_tonnes_yr=co2_saved_tonnes_yr,
        co2_reduction_pct=co2_reduction_pct,
        carbon_abatement_cost_usd=carbon_abatement_cost_usd,
        cac_verdict=cac_verdict,
        grid_region=grid_region,
        fleet_size=fleet_size,
        payback_years=payback_years,
    )

    explanation: str
    actual_mode: str = mode

    # Try the best available mode, fall back gracefully on failure
    if mode == "gemini":
        try:
            explanation = _call_gemini(system_prompt, user_prompt)
            actual_mode = "gemini"
        except Exception:
            explanation = _generate_mock_explanation(
                vehicle_make=vehicle_make, vehicle_model=vehicle_model,
                vehicle_category=vehicle_category, battery_chemistry=battery_chemistry,
                suitability_score=suitability_score, range_buffer_pct=range_buffer_pct,
                payload_margin_kg=payload_margin_kg, tco_5yr_usd=tco_5yr_usd,
                cost_per_km_usd=cost_per_km_usd,
                charging_window_utilization_pct=charging_window_utilization_pct,
                supplier_risk_score=supplier_risk_score,
                supplier_risk_category=supplier_risk_category,
                primary_risk_driver=primary_risk_driver,
                co2_saved_tonnes_yr=co2_saved_tonnes_yr,
                co2_reduction_pct=co2_reduction_pct,
                carbon_abatement_cost_usd=carbon_abatement_cost_usd,
                cac_verdict=cac_verdict, grid_region=grid_region,
                fleet_size=fleet_size, payback_years=payback_years,
            )
            actual_mode = "mock (gemini_failed)"

    elif mode == "openai":
        try:
            explanation = _call_openai(system_prompt, user_prompt)
            actual_mode = "openai"
        except Exception:
            explanation = _generate_mock_explanation(
                vehicle_make=vehicle_make, vehicle_model=vehicle_model,
                vehicle_category=vehicle_category, battery_chemistry=battery_chemistry,
                suitability_score=suitability_score, range_buffer_pct=range_buffer_pct,
                payload_margin_kg=payload_margin_kg, tco_5yr_usd=tco_5yr_usd,
                cost_per_km_usd=cost_per_km_usd,
                charging_window_utilization_pct=charging_window_utilization_pct,
                supplier_risk_score=supplier_risk_score,
                supplier_risk_category=supplier_risk_category,
                primary_risk_driver=primary_risk_driver,
                co2_saved_tonnes_yr=co2_saved_tonnes_yr,
                co2_reduction_pct=co2_reduction_pct,
                carbon_abatement_cost_usd=carbon_abatement_cost_usd,
                cac_verdict=cac_verdict, grid_region=grid_region,
                fleet_size=fleet_size, payback_years=payback_years,
            )
            actual_mode = "mock (openai_failed)"

    else:
        explanation = _generate_mock_explanation(
            vehicle_make=vehicle_make, vehicle_model=vehicle_model,
            vehicle_category=vehicle_category, battery_chemistry=battery_chemistry,
            suitability_score=suitability_score, range_buffer_pct=range_buffer_pct,
            payload_margin_kg=payload_margin_kg, tco_5yr_usd=tco_5yr_usd,
            cost_per_km_usd=cost_per_km_usd,
            charging_window_utilization_pct=charging_window_utilization_pct,
            supplier_risk_score=supplier_risk_score,
            supplier_risk_category=supplier_risk_category,
            primary_risk_driver=primary_risk_driver,
            co2_saved_tonnes_yr=co2_saved_tonnes_yr,
            co2_reduction_pct=co2_reduction_pct,
            carbon_abatement_cost_usd=carbon_abatement_cost_usd,
            cac_verdict=cac_verdict, grid_region=grid_region,
            fleet_size=fleet_size, payback_years=payback_years,
        )
        actual_mode = "mock"

    return {
        "explanation":    explanation,
        "mode":           actual_mode,
        "generated_at":   datetime.utcnow().isoformat() + "Z",
        "vehicle":        f"{vehicle_make} {vehicle_model}",
        "risk_category":  supplier_risk_category,
        "co2_impact": {
            "co2_saved_tonnes_per_vehicle_yr": round(co2_saved_tonnes_yr, 2),
            "co2_reduction_pct":               round(co2_reduction_pct, 1),
            "fleet_size":                      fleet_size,
        },
    }


# ---------------------------------------------------------------------------
# Standalone Verification Test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 70)
    print("  AI Explainer Service - Quick Verification")
    print("=" * 70)

    mode = _detect_llm_mode()
    print(f"\n  Detected LLM Mode: {mode.upper()}")
    if mode == "mock":
        print("  (No API keys set — running mock fallback engine)")

    print("\n  Generating explanation for Mercedes-Benz eSprinter...")
    print("-" * 70)

    result = generate_ai_explanation(
        vehicle_make="Mercedes-Benz",
        vehicle_model="eSprinter Van",
        vehicle_category="Light Van",
        battery_chemistry="LFP",
        suitability_score=87.5,
        range_buffer_pct=83.1,
        payload_margin_kg=200.0,
        tco_5yr_usd=101400.0,
        cost_per_km_usd=0.3380,
        charging_window_utilization_pct=11.1,
        supplier_risk_score=68.0,
        supplier_risk_category="High",
        primary_risk_driver="geopolitical_risk",
        co2_saved_tonnes_yr=4.12,
        co2_reduction_pct=67.6,
        carbon_abatement_cost_usd=2418.75,
        cac_verdict="High: electrification costly — reassess route or vehicle choice",
        grid_region="europe_average",
        fleet_size=20,
        payback_years=8.2,
    )

    print(f"\n  Mode Used    : {result['mode']}")
    print(f"  Generated At : {result['generated_at']}")
    print(f"  Vehicle      : {result['vehicle']}")
    print(f"  Risk Level   : {result['risk_category']}")
    print(f"  CO2 Saved    : {result['co2_impact']['co2_saved_tonnes_per_vehicle_yr']} t/yr/vehicle")
    print(f"\n{'='*70}")
    print("  EXECUTIVE EXPLANATION:")
    print(f"{'='*70}\n")
    print(result["explanation"])
    print(f"\n{'='*70}")
    print("  AI Explainer verification complete.")

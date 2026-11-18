
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.Supplier import Supplier
from app.models.BatteryMaterial import BatteryMaterial
from app.models.SupplierRiskAssessment import SupplierRiskAssessment


router = APIRouter(
    prefix="/api/v1/supply-chain",
    tags=["Supply Chain"],
)


# ---------------------------------------------------------
# 1. Retrieve latest risk assessment for each supplier
# ---------------------------------------------------------

def get_latest_assessments(db: Session):
    records = (
        db.query(SupplierRiskAssessment)
        .options(
            joinedload(SupplierRiskAssessment.supplier),
            joinedload(SupplierRiskAssessment.material),
        )
        .order_by(
            SupplierRiskAssessment.assessed_at.desc(),
            SupplierRiskAssessment.id.desc(),
        )
        .all()
    )

    latest_by_supplier = {}
    latest_by_material = {}

    for record in records:
        if record.supplier_id not in latest_by_supplier:
            latest_by_supplier[record.supplier_id] = record

        if record.material_id not in latest_by_material:
            latest_by_material[record.material_id] = record

    return latest_by_supplier, latest_by_material


# ---------------------------------------------------------
# 2. Supply Chain Summary
# ---------------------------------------------------------

@router.get("/summary")
def get_supply_chain_summary(
    db: Session = Depends(get_db),
):

    suppliers = db.query(Supplier).count()
    materials = db.query(BatteryMaterial).count()

    latest_by_supplier, _ = get_latest_assessments(db)

    assessments = list(latest_by_supplier.values())

    high = sum(
        str(a.risk_level).lower() == "high"
        for a in assessments
    )

    medium = sum(
        str(a.risk_level).lower() == "medium"
        for a in assessments
    )

    low = sum(
        str(a.risk_level).lower() == "low"
        for a in assessments
    )

    return {
        "suppliers_analyzed": suppliers,
        "materials_analyzed": materials,
        "risk_assessments": len(assessments),
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "data_source": "PostgreSQL",
    }


# ---------------------------------------------------------
# 3. Supplier Risk Records
# ---------------------------------------------------------

@router.get("/suppliers")
def get_suppliers(
    db: Session = Depends(get_db),
):

    suppliers = (
        db.query(Supplier)
        .order_by(Supplier.name)
        .all()
    )

    latest_by_supplier, _ = get_latest_assessments(db)

    results = []

    for supplier in suppliers:

        assessment = latest_by_supplier.get(supplier.id)

        results.append({
            "id": supplier.id,
            "supplier": supplier.name,
            "country": supplier.origin_country,
            "material": (
                assessment.material.name
                if assessment and assessment.material
                else "Not assessed"
            ),
            "risk_score": (
                assessment.risk_score
                if assessment
                else None
            ),
            "risk_level": (
                str(assessment.risk_level).capitalize()
                if assessment
                else "Not assessed"
            ),
            "key_concerns": None,
            "assessed_at": (
                assessment.assessed_at.isoformat()
                if assessment and assessment.assessed_at
                else None
            ),
            "data_source": supplier.data_source,
        })

    return {
        "count": len(results),
        "suppliers": results,
        "data_source": "PostgreSQL supplier and risk assessment records",
    }


# ---------------------------------------------------------
# 4. Battery Material Records
# ---------------------------------------------------------

@router.get("/materials")
def get_battery_materials(
    db: Session = Depends(get_db),
):

    materials = (
        db.query(BatteryMaterial)
        .order_by(BatteryMaterial.name)
        .all()
    )

    _, latest_by_material = get_latest_assessments(db)

    results = []

    for material in materials:

        assessment = latest_by_material.get(material.id)

        results.append({
            "id": material.id,
            "name": material.name,
            "origin_country": material.origin_country,
            "price_indicator": material.price_indicator,
            "price_volatility_indicator": (
                material.price_volatility_indicator
            ),
            "sustainability_indicator": (
                material.sustainability_indicator
            ),
            "risk_score": (
                assessment.risk_score
                if assessment
                else None
            ),
            "risk_level": (
                str(assessment.risk_level).capitalize()
                if assessment
                else "Not assessed"
            ),
            "supplier": (
                assessment.supplier.name
                if assessment and assessment.supplier
                else "Not assigned"
            ),
            "data_source": material.data_source,
        })

    return {
        "count": len(results),
        "materials": results,
        "data_source": "PostgreSQL battery material records",
    }


# ---------------------------------------------------------
# 5. Complete Supplier Risk Assessment History
# ---------------------------------------------------------

@router.get("/assessments")
def get_risk_assessment_history(
    db: Session = Depends(get_db),
):

    records = (
        db.query(SupplierRiskAssessment)
        .options(
            joinedload(SupplierRiskAssessment.supplier),
            joinedload(SupplierRiskAssessment.material),
        )
        .order_by(
            SupplierRiskAssessment.assessed_at.desc()
        )
        .all()
    )

    return {
        "count": len(records),
        "assessments": [
            {
                "id": record.id,
                "supplier_id": record.supplier_id,
                "supplier": record.supplier.name,
                "material_id": record.material_id,
                "material": record.material.name,
                "risk_score": record.risk_score,
                "risk_level": str(record.risk_level).capitalize(),
                "assessed_at": (
                    record.assessed_at.isoformat()
                    if record.assessed_at
                    else None
                ),
                "data_source": record.supplier.data_source,
            }
            for record in records
        ],
    }

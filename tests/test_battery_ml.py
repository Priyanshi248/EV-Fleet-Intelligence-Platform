import pytest

from battery_ml.service import vehicle_health


VEHICLE_IDS = ["EV-001", "EV-002", "EV-003"]


@pytest.mark.parametrize("vehicle_id", VEHICLE_IDS)
def test_vehicle_health_returns_valid_predictions(vehicle_id):
    result = vehicle_health(vehicle_id)

    assert result["vehicle_id"] == vehicle_id
    assert result["soh_pct"] is not None
    assert 0 <= result["soh_pct"] <= 100

    assert result["soh_measured_pct"] is not None
    assert 0 <= result["soh_measured_pct"] <= 100

    assert result["rul"]["rul_cycles"] >= 0
    assert result["rul"]["rul_years"] >= 0

    assert result["degradation"]["degradation_rate_pct_per_month"] >= 0

    assert isinstance(result["trend"], list)
    assert len(result["trend"]) > 0

    assert isinstance(result["analysis"], list)
    assert len(result["analysis"]) > 0

    assert isinstance(result["can_bus"], dict)
    assert isinstance(result["risk"], dict)


def test_vehicle_predictions_are_vehicle_specific():
    results = {
        vehicle_id: vehicle_health(vehicle_id)
        for vehicle_id in VEHICLE_IDS
    }

    predicted_soh_values = {
        round(result["soh_pct"], 1)
        for result in results.values()
    }

    cycle_values = {
        result["can_bus"]["cycles"]
        for result in results.values()
    }

    assert len(predicted_soh_values) == 3
    assert len(cycle_values) == 3


def test_unknown_vehicle_raises_key_error():
    with pytest.raises(KeyError):
        vehicle_health("EV-999")
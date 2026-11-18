
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const getDashboardSummary = () =>
  apiRequest("/api/v1/dashboard/summary");

export const getVehicles = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return apiRequest(
    `/api/v1/fleet/vehicles${query ? `?${query}` : ""}`
  );
};

export const getVehicleById = (id) =>
  apiRequest(`/api/v1/fleet/vehicles/${id}`);

export const getVehicleTelemetry = (id, limit = 100) =>
  apiRequest(
    `/api/v1/fleet/vehicles/${id}/telemetry?limit=${limit}`
  );

export const getChargingSessions = (id, limit = 100) =>
  apiRequest(
    `/api/v1/fleet/vehicles/${id}/charging-sessions?limit=${limit}`
  );

export const getBatteryPredictions = (id, limit = 100) =>
  apiRequest(
    `/api/v1/fleet/vehicles/${id}/battery-predictions?limit=${limit}`
  );


export const getMaintenanceAlerts = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return apiRequest(
    `/api/v1/maintenance/alerts${query ? `?${query}` : ''}`
  );
};


export const createVehicle = (vehicleData) =>
  apiRequest("/api/v1/fleet/vehicles", {
    method: "POST",
    body: JSON.stringify(vehicleData),
  });

export const updateMaintenanceAlertStatus = (alertId, status) =>
  apiRequest(`/api/v1/maintenance/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// Battery ML health predictions
export const getBatteryHealth = (vehicleId) =>
  apiRequest(`/api/v1/battery/${encodeURIComponent(vehicleId)}/health`);

// Battery ML model evaluation metrics
export const getMLMetrics = () =>
  apiRequest("/api/v1/ml/metrics");

// Procurement APIs
export const getProcurementCatalog = () =>
  apiRequest("/api/v1/procurement/catalog");

export const generateProcurementRecommendations = (requirements) =>
  apiRequest("/api/v1/procurement/recommendations", {
    method: "POST",
    body: JSON.stringify(requirements),
  });

export const getProcurementRecommendationHistory = (limit = 20) =>
  apiRequest(`/api/v1/procurement/recommendations/history?limit=${limit}`);

// Supply Chain APIs
export const getSupplyChainSummary = () =>
  apiRequest("/api/v1/supply-chain/summary");

export const getSupplyChainSuppliers = () =>
  apiRequest("/api/v1/supply-chain/suppliers");

export const getBatteryMaterials = () =>
  apiRequest("/api/v1/supply-chain/materials");

export const getSupplyChainAssessments = () =>
  apiRequest("/api/v1/supply-chain/assessments");

export const getNetZeroSummary = () =>
  apiRequest("/api/v1/net-zero/summary");

export const getNetZeroScenarios = () =>
  apiRequest("/api/v1/net-zero/scenarios");

export const createNetZeroScenario = (payload) =>
  apiRequest("/api/v1/net-zero/scenarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  export const sendAssistantMessage = (message) =>
  apiRequest("/api/v1/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

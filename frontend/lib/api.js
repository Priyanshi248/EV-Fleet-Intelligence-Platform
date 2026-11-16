
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

export const createVehicle = (vehicleData) =>
  apiRequest("/api/v1/fleet/vehicles", {
    method: "POST",
    body: JSON.stringify(vehicleData),
  });

import { apiFetch, FASTAPI_BASE_URL } from './api';

export interface HealthFormData {
  fullName: string;
  email: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
  symptoms: string;
  medicalHistory: string;
  dietaryPreferences: string;
  activityLevel: string;
  goals: string;
  consent: boolean;
}

export interface HealthAnalysisResponse {
  success: boolean;
  thread_id: string;
  run_id: string;
  analysis: string;
  message: string;
}

export async function submitHealthForm(data: HealthFormData): Promise<HealthAnalysisResponse> {
  // Transform frontend form data to backend expected format
  const payload = {
    name: data.fullName,
    age: parseInt(data.age) || 0,
    weight: parseFloat(data.weight) || 0,
    height: parseFloat(data.height) || 0,
    health_conditions: data.medicalHistory ? [data.medicalHistory] : [],
    dietary_preferences: data.dietaryPreferences
      ? data.dietaryPreferences.split(',').map((s) => s.trim())
      : [],
    activity_level: data.activityLevel,
    goals: data.goals ? data.goals.split(',').map((s) => s.trim()) : [],
  };

  // Use direct fetch for FastAPI endpoint since apiFetch uses the NestJS base URL
  const response = await fetch(`${FASTAPI_BASE_URL}/submit-health-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return await response.json();
}

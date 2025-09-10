import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3100';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },
};

// Form Data API
export const formDataAPI = {
  getCountries: async () => {
    const response = await api.get('/api/form-data/countries');
    return response.data;
  },

  getStates: async (countryId: string) => {
    const response = await api.get(`/api/form-data/states/${countryId}`);
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/api/form-data/departments');
    return response.data;
  },

  getTeams: async (departmentId: string) => {
    const response = await api.get(`/api/form-data/teams/${departmentId}`);
    return response.data;
  },

  getSkills: async (params: {
    search?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/form-data/skills', { params });
    return response.data;
  },

  getJobTitles: async (params: {
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/form-data/job-titles', { params });
    return response.data;
  },
};

// Form Submission API
export const formsAPI = {
  submitBasicForm: async (data: any) => {
    const response = await api.post('/api/forms/basic', data);
    return response.data;
  },

  submitComplexForm: async (data: any) => {
    const response = await api.post('/api/forms/complex', data);
    return response.data;
  },

  startMultiPageForm: async () => {
    const response = await api.post('/api/forms/multipage/start');
    return response.data;
  },

  savePageData: async (sessionId: string, pageNumber: number, data: any) => {
    const response = await api.post(
      `/api/forms/multipage/${sessionId}/page/${pageNumber}`,
      data
    );
    return response.data;
  },

  getSessionData: async (sessionId: string) => {
    const response = await api.get(`/api/forms/multipage/${sessionId}`);
    return response.data;
  },

  submitMultiPageForm: async (sessionId: string) => {
    const response = await api.post(`/api/forms/multipage/${sessionId}/submit`);
    return response.data;
  },

  // Submissions
  getSubmissions: async (params?: { type?: string; kind?: string; from?: string; to?: string; q?: string }): Promise<any[]> => {
    const response = await api.get('/api/forms/submissions', { params });
    return response.data;
  },

  getSubmission: async (id: string): Promise<any> => {
    const response = await api.get(`/api/forms/submissions/${id}`);
    return response.data;
  },
};

export default api;

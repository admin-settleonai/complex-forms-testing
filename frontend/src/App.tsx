import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BasicFormPage from './pages/BasicFormPage';
import DynamicDropdownFormPage from './pages/DynamicDropdownFormPage';
import HierarchicalFormPage from './pages/HierarchicalFormPage';
import ProgressiveLoadingFormPage from './pages/ProgressiveLoadingFormPage';
import MultiPageFormPage from './pages/MultiPageFormPage';
import ComplexIntegrationFormPage from './pages/ComplexIntegrationFormPage';
import WorkdayStyleFormPage from './pages/WorkdayStyleFormPage';
import GreenhouseStyleFormPage from './pages/GreenhouseStyleFormPage';
import LeverStyleFormPage from './pages/LeverStyleFormPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="forms/basic" element={<BasicFormPage />} />
            <Route path="forms/dynamic-dropdown" element={<DynamicDropdownFormPage />} />
            <Route path="forms/hierarchical" element={<HierarchicalFormPage />} />
            <Route path="forms/progressive-loading" element={<ProgressiveLoadingFormPage />} />
            <Route path="forms/multi-page" element={<MultiPageFormPage />} />
            <Route path="forms/complex-integration" element={<ComplexIntegrationFormPage />} />
            <Route path="forms/workday-style" element={<WorkdayStyleFormPage />} />
            <Route path="forms/greenhouse-style" element={<GreenhouseStyleFormPage />} />
            <Route path="forms/lever-style" element={<LeverStyleFormPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
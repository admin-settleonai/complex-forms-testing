import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicDropdown from '../components/dropdowns/DynamicDropdown';
import { formDataAPI, formsAPI } from '../services/api';
import { SelectOption } from '../types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormData {
  country: string;
  state: string;
  department: string;
  team: string;
  comments: string;
}

const DynamicDropdownFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    country: '',
    state: '',
    department: '',
    team: '',
    comments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (field: keyof FormData) => (value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadCountries = async (): Promise<SelectOption[]> => {
    const countries = await formDataAPI.getCountries();
    return countries.map((c: any) => ({
      value: c.id,
      label: c.name,
    }));
  };

  const loadStates = async (): Promise<SelectOption[]> => {
    if (!formData.country) return [];
    const states = await formDataAPI.getStates(formData.country);
    return states.map((s: any) => ({
      value: s.id,
      label: s.name,
    }));
  };

  const loadDepartments = async (): Promise<SelectOption[]> => {
    const departments = await formDataAPI.getDepartments();
    return departments.map((d: any) => ({
      value: d.id,
      label: d.name,
    }));
  };

  const loadTeams = async (): Promise<SelectOption[]> => {
    if (!formData.department) return [];
    const teams = await formDataAPI.getTeams(formData.department);
    return teams.map((t: any) => ({
      value: t.id,
      label: t.name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await formsAPI.submitComplexForm({
        type: 'dynamic-dropdown',
        data: formData,
      });
      setSubmitSuccess(true);
      console.log('Form submitted:', formData);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-green-50 rounded-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Form Submitted Successfully!
          </h2>
          <p className="text-green-700">
            Redirecting to dashboard in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Dynamic Dropdown Form
        </h1>
        <p className="text-gray-600 mb-8">
          This form demonstrates cascading dropdowns that load data dynamically 
          from the API. Select a country to load states, and select a department 
          to load teams.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Location Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DynamicDropdown
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange('country')}
                loadOptions={loadCountries}
                placeholder="Select a country..."
                required
                isSearchable
              />

              <DynamicDropdown
                label="State/Province"
                name="state"
                value={formData.state}
                onChange={handleChange('state')}
                loadOptions={loadStates}
                placeholder={formData.country ? "Select a state..." : "Select a country first"}
                dependsOn={formData.country}
                cacheKey={formData.country}
                isSearchable
              />
            </div>
          </div>

          {/* Department Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Department Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DynamicDropdown
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange('department')}
                loadOptions={loadDepartments}
                placeholder="Select a department..."
                required
                isSearchable
              />

              <DynamicDropdown
                label="Team"
                name="team"
                value={formData.team}
                onChange={handleChange('team')}
                loadOptions={loadTeams}
                placeholder={formData.department ? "Select a team..." : "Select a department first"}
                dependsOn={formData.department}
                cacheKey={formData.department}
                isSearchable
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any additional information..."
            />
          </div>

          {/* Form State Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Current Form State (Debug)
            </h3>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.country || !formData.department}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          How Dynamic Dropdowns Work
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Country dropdown loads immediately when the form opens</li>
          <li>• State dropdown remains disabled until a country is selected</li>
          <li>• When country changes, state dropdown resets and reloads</li>
          <li>• Department and Team dropdowns work the same way</li>
          <li>• All data is fetched from the API with simulated network delay</li>
        </ul>
      </div>
    </div>
  );
};

export default DynamicDropdownFormPage;

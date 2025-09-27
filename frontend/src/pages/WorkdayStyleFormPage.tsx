import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import WorkdayDropdown from '../components/dropdowns/WorkdayDropdown';

interface FormData {
  // Source selection (radio group)
  sourceType: string;
  referralSource: string;
  
  // Country/State (hierarchical dropdowns)
  country1: string;
  state1: string;
  country2: string;
  state2: string;
  
  // Personal Info (text fields)
  firstName1: string;
  lastName1: string;
  firstName2: string;
  lastName2: string;
  
  // Address (text fields)
  addressLine1_1: string;
  city1: string;
  postalCode1: string;
  addressLine1_2: string;
  city2: string;
  postalCode2: string;
  
  // Phone (dynamic dropdowns)
  phoneCountryCode1: string;
  phoneNumber1: string;
  phoneType1: string;
  phoneCountryCode2: string;
  phoneNumber2: string;
  phoneType2: string;
  
  // Checkboxes
  preferredName1: boolean;
  smsOptIn1: boolean;
  preferredName2: boolean;
  smsOptIn2: boolean;
  
  // Department/Team (dynamic hierarchical)
  department1: string;
  team1: string;
  department2: string;
  team2: string;
}

const WorkdayStyleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    sourceType: '',
    referralSource: '',
    country1: '',
    state1: '',
    country2: '',
    state2: '',
    firstName1: '',
    lastName1: '',
    firstName2: '',
    lastName2: '',
    addressLine1_1: '',
    city1: '',
    postalCode1: '',
    addressLine1_2: '',
    city2: '',
    postalCode2: '',
    phoneCountryCode1: '',
    phoneNumber1: '',
    phoneType1: '',
    phoneCountryCode2: '',
    phoneNumber2: '',
    phoneType2: '',
    preferredName1: false,
    smsOptIn1: false,
    preferredName2: false,
    smsOptIn2: false,
    department1: '',
    team1: '',
    department2: '',
    team2: ''
  });
  
  // No need to manage states, teams, etc. locally - WorkdayDropdown handles them

  // Clear dependent fields when parent changes
  useEffect(() => {
    if (!formData.country1) {
      setFormData(prev => ({ ...prev, state1: '' }));
    }
  }, [formData.country1]);

  useEffect(() => {
    if (!formData.country2) {
      setFormData(prev => ({ ...prev, state2: '' }));
    }
  }, [formData.country2]);

  useEffect(() => {
    if (!formData.department1) {
      setFormData(prev => ({ ...prev, team1: '' }));
    }
  }, [formData.department1]);

  useEffect(() => {
    if (!formData.department2) {
      setFormData(prev => ({ ...prev, team2: '' }));
    }
  }, [formData.department2]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/forms/workday', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Workday form submitted successfully!');
      navigate('/submitted-forms');
    } catch (error) {
      console.error('Failed to submit form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderFieldGroup = (suffix: '1' | '2') => {
    const countryField = `country${suffix}` as keyof FormData;
    const stateField = `state${suffix}` as keyof FormData;
    const firstNameField = `firstName${suffix}` as keyof FormData;
    const lastNameField = `lastName${suffix}` as keyof FormData;
    const addressField = `addressLine1_${suffix}` as keyof FormData;
    const cityField = `city${suffix}` as keyof FormData;
    const postalField = `postalCode${suffix}` as keyof FormData;
    const phoneCodeField = `phoneCountryCode${suffix}` as keyof FormData;
    const phoneNumberField = `phoneNumber${suffix}` as keyof FormData;
    const phoneTypeField = `phoneType${suffix}` as keyof FormData;
    const preferredNameField = `preferredName${suffix}` as keyof FormData;
    const smsOptInField = `smsOptIn${suffix}` as keyof FormData;
    const departmentField = `department${suffix}` as keyof FormData;
    const teamField = `team${suffix}` as keyof FormData;
    
    return (
      <div className="space-y-6 border-l-4 border-blue-500 pl-6">
        <h3 className="text-lg font-semibold text-gray-900">Set {suffix}</h3>
        
        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={firstNameField} className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id={firstNameField}
              name={firstNameField}
              data-automation-id={`name--legalName--firstName--${suffix}`}
              value={String(formData[firstNameField] || '')}
              onChange={(e) => handleChange(firstNameField, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor={lastNameField} className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id={lastNameField}
              name={lastNameField}
              data-automation-id={`name--legalName--lastName--${suffix}`}
              value={String(formData[lastNameField] || '')}
              onChange={(e) => handleChange(lastNameField, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Checkbox for preferred name */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={preferredNameField}
            name={preferredNameField}
            data-automation-id={`name--preferredCheck--${suffix}`}
            checked={Boolean(formData[preferredNameField])}
            onChange={(e) => handleChange(preferredNameField, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={preferredNameField} className="ml-2 block text-sm text-gray-900">
            Use preferred name
          </label>
        </div>

        {/* Address */}
        <div>
          <label htmlFor={addressField} className="block text-sm font-medium text-gray-700">
            Address Line 1
          </label>
          <input
            type="text"
            id={addressField}
            name={addressField}
            data-automation-id={`address--addressLine1--${suffix}`}
              value={String(formData[addressField] || '')}
            onChange={(e) => handleChange(addressField, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor={cityField} className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id={cityField}
              name={cityField}
              data-automation-id={`address--city--${suffix}`}
              value={String(formData[cityField] || '')}
              onChange={(e) => handleChange(cityField, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <WorkdayDropdown
              label="Country"
              name={countryField}
              dataAutomationId={`address--countryRegion--${suffix}`}
              value={String(formData[countryField] || '')}
              onChange={(value) => handleChange(countryField, value)}
              endpoint="/api/form-data/countries"
              placeholder="Select Country"
            />
          </div>

          <div>
            <label htmlFor={postalField} className="block text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              type="text"
              id={postalField}
              name={postalField}
              data-automation-id={`address--postalCode--${suffix}`}
              value={String(formData[postalField] || '')}
              onChange={(e) => handleChange(postalField, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* State - Dynamic based on country */}
        {formData[countryField] && (
          <WorkdayDropdown
            label="State/Province"
            name={stateField}
            dataAutomationId={`address--state--${suffix}`}
            value={String(formData[stateField] || '')}
            onChange={(value) => handleChange(stateField, value)}
            endpoint="/api/form-data/workday/states"
            placeholder="Select State"
            parentValue={String(formData[countryField] || '')}
          />
        )}

        {/* Phone Information */}
        <div className="grid grid-cols-3 gap-4">
          <WorkdayDropdown
            label="Phone Country Code"
            name={phoneCodeField}
            dataAutomationId={`phone--countryCode--${suffix}`}
            value={String(formData[phoneCodeField] || '')}
            onChange={(value) => handleChange(phoneCodeField, value)}
            endpoint="/api/form-data/workday/phone-codes"
            placeholder="Select Code"
          />

          <div>
            <label htmlFor={phoneNumberField} className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id={phoneNumberField}
              name={phoneNumberField}
              data-automation-id={`phone--number--${suffix}`}
              value={String(formData[phoneNumberField] || '')}
              onChange={(e) => handleChange(phoneNumberField, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <WorkdayDropdown
            label="Phone Type"
            name={phoneTypeField}
            dataAutomationId={`phone--type--${suffix}`}
            value={String(formData[phoneTypeField] || '')}
            onChange={(value) => handleChange(phoneTypeField, value)}
            endpoint="/api/form-data/workday/phone-types"
            placeholder="Select Type"
          />
        </div>

        {/* SMS Opt-in */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={smsOptInField}
            name={smsOptInField}
            data-automation-id={`phone--smsOptIn--${suffix}`}
            checked={Boolean(formData[smsOptInField])}
            onChange={(e) => handleChange(smsOptInField, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={smsOptInField} className="ml-2 block text-sm text-gray-900">
            Opt-in for SMS notifications
          </label>
        </div>

        {/* Department/Team - Dynamic hierarchical */}
        <div className="grid grid-cols-2 gap-4">
          <WorkdayDropdown
            label="Department"
            name={departmentField}
            dataAutomationId={`organization--department--${suffix}`}
            value={String(formData[departmentField] || '')}
            onChange={(value) => handleChange(departmentField, value)}
            endpoint="/api/form-data/departments"
            placeholder="Select Department"
          />

          {formData[departmentField] && (
            <WorkdayDropdown
              label="Team"
              name={teamField}
              dataAutomationId={`organization--team--${suffix}`}
              value={String(formData[teamField] || '')}
              onChange={(value) => handleChange(teamField, value)}
              endpoint="/api/form-data/workday/teams"
              placeholder="Select Team"
              parentValue={String(formData[departmentField] || '')}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Workday Style Application Form</h1>
        <p className="text-gray-600 mb-8">
          This form demonstrates Workday-style patterns with dynamic dropdowns, hierarchical fields, and ARIA attributes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Source Selection - Radio Group */}
          <div>
            <fieldset>
              <legend className="text-lg font-medium text-gray-900 mb-4">How did you hear about us?</legend>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="source-website"
                    name="sourceType"
                    value="website"
                    data-automation-id="source--type--website"
                    checked={formData.sourceType === 'website'}
                    onChange={(e) => handleChange('sourceType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="source-website" className="ml-2 block text-sm text-gray-900">
                    Company Website
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="source-referral"
                    name="sourceType"
                    value="referral"
                    data-automation-id="source--type--referral"
                    checked={formData.sourceType === 'referral'}
                    onChange={(e) => handleChange('sourceType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="source-referral" className="ml-2 block text-sm text-gray-900">
                    Employee Referral
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="source-job-board"
                    name="sourceType"
                    value="job-board"
                    data-automation-id="source--type--jobBoard"
                    checked={formData.sourceType === 'job-board'}
                    onChange={(e) => handleChange('sourceType', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="source-job-board" className="ml-2 block text-sm text-gray-900">
                    Job Board
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Conditional field based on referral selection */}
            {formData.sourceType === 'referral' && (
              <div className="mt-4">
                <label htmlFor="referralSource" className="block text-sm font-medium text-gray-700">
                  Employee Name (Referral)
                </label>
                <input
                  type="text"
                  id="referralSource"
                  name="referralSource"
                  data-automation-id="source--referralName"
                  value={String(formData.referralSource || '')}
                  onChange={(e) => handleChange('referralSource', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter employee name"
                />
              </div>
            )}
          </div>

          {/* Two sets of fields to demonstrate multiple instances */}
          {renderFieldGroup('1')}
          {renderFieldGroup('2')}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              data-automation-id="submit-application"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkdayStyleFormPage;
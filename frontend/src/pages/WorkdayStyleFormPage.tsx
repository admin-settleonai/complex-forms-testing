import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import WorkdayDropdown from '../components/dropdowns/WorkdayDropdown';
import WorkdayHierarchicalDropdown from '../components/dropdowns/WorkdayHierarchicalDropdown';
import { initializeGoApplyDiscovery } from '../utils/goapplyIntegration';

interface FormData {
  // Source selection (radio group)
  sourceType: string;
  referralSource: string;
  
  // Country/State (hierarchical dropdowns)
  countryState1: string; // Will store as "US|CA" format
  countryState2: string;
  
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
  departmentTeam1: string; // Will store as "eng|frontend" format
  departmentTeam2: string;
}

const WorkdayStyleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    sourceType: '',
    referralSource: '',
    countryState1: '',
    countryState2: '',
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
    departmentTeam1: '',
    departmentTeam2: ''
  });

  // Listen for external value changes (from GoApply prefilling)
  useEffect(() => {
    if (!formRef.current) return;

    const handleExternalChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.name) return;

      const fieldName = target.name as keyof FormData;
      let value: any = target.value;

      // Handle checkboxes
      if (target.type === 'checkbox') {
        value = target.checked;
      }

      // Update React state if value differs from current state
      setFormData(prev => {
        if (prev[fieldName] !== value) {
          console.log(`[WorkdayForm] External change detected: ${fieldName} = ${value}`);
          return { ...prev, [fieldName]: value };
        }
        return prev;
      });
    };

    // Listen for input and change events on all form inputs
    const inputs = formRef.current.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', handleExternalChange);
      input.addEventListener('change', handleExternalChange);
    });

    // Also use MutationObserver to detect direct value changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          const target = mutation.target as HTMLInputElement;
          if (target.name) {
            handleExternalChange(new Event('change', { target: target as any }));
          }
        }
      });
    });

    inputs.forEach(input => {
      observer.observe(input, { 
        attributes: true, 
        attributeFilter: ['value', 'checked'] 
      });
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('input', handleExternalChange);
        input.removeEventListener('change', handleExternalChange);
      });
      observer.disconnect();
    };
  }, []);
  
  // Initialize Workday-style behavior on mount
  useEffect(() => {
    // Initialize immediately, just like Workday does
    initializeGoApplyDiscovery();
  }, []);
  
  // No need to manage states, teams, etc. locally - WorkdayDropdown handles them
  // Hierarchical dropdowns now handle their own state internally

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
    const countryStateField = `countryState${suffix}` as keyof FormData;
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
    const departmentTeamField = `departmentTeam${suffix}` as keyof FormData;
    
    return (
      <div className="space-y-6 border-l-4 border-blue-500 pl-6">
        {/* Removed the Set heading since we only have one form now */}
        
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
            <WorkdayHierarchicalDropdown
              label="Country/State"
              name={countryStateField}
              dataAutomationId={`address--countryState--${suffix}`}
              value={String(formData[countryStateField] || '')}
              onChange={(value) => handleChange(countryStateField, value)}
              endpoints={{
                level1: "/api/form-data/workday/countries",
                level2: "/api/form-data/workday/states"
              }}
              placeholder="Select Country/State"
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
        <WorkdayHierarchicalDropdown
          label="Department/Team"
          name={departmentTeamField}
          dataAutomationId={`organization--departmentTeam--${suffix}`}
          value={String(formData[departmentTeamField] || '')}
          onChange={(value) => handleChange(departmentTeamField, value)}
          endpoints={{
            level1: "/api/form-data/workday/departments",
            level2: "/api/form-data/workday/teams"
          }}
          placeholder="Select Department/Team"
        />
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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Single set of fields - Updated to remove duplicate forms */}
          {renderFieldGroup('1')}

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
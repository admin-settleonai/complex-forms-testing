import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listbox } from '@headlessui/react';
import { formsAPI } from '../services/api';
import { CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type Option = { value: string; label: string };

const ULListbox: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  disabled?: boolean;
  placeholder: string;
}> = ({ value, onChange, options, disabled = false, placeholder }) => {
  const selected = useMemo(() => options.find(o => o.value === value)?.label || placeholder, [options, value, placeholder]);
  return (
    <Listbox value={value} onChange={(val: string) => { if (val !== value) onChange(val); }} disabled={disabled}>
      <div className="relative">
        <Listbox.Button disabled={disabled} className={`relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className="block truncate text-gray-700">{selected}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </span>
        </Listbox.Button>
        {!disabled && (
          <Listbox.Options as="ul" className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-64 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto divide-y divide-gray-100">
            {options.map(opt => (
              <Listbox.Option key={opt.value} value={opt.value} as="li" className={({ active, selected }) => `px-3 py-2 cursor-pointer ${active ? 'bg-gray-100' : ''} ${selected ? 'font-semibold' : ''}`}>
                {opt.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        )}
      </div>
    </Listbox>
  );
};

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

  const englishCountries = useMemo(() => (
    [
      { id: 'US', name: 'United States' },
      { id: 'CA', name: 'Canada' },
      { id: 'GB', name: 'United Kingdom' },
      { id: 'IE', name: 'Ireland' },
      { id: 'AU', name: 'Australia' },
      { id: 'NZ', name: 'New Zealand' },
    ]
  ), []);

  const statesByCountry: Record<string, { id: string; name: string }[]> = useMemo(() => ({
    US: [
      { id: 'AL', name: 'Alabama' }, { id: 'AK', name: 'Alaska' }, { id: 'AZ', name: 'Arizona' }, { id: 'AR', name: 'Arkansas' },
      { id: 'CA', name: 'California' }, { id: 'CO', name: 'Colorado' }, { id: 'CT', name: 'Connecticut' }, { id: 'DE', name: 'Delaware' },
      { id: 'FL', name: 'Florida' }, { id: 'GA', name: 'Georgia' }, { id: 'HI', name: 'Hawaii' }, { id: 'ID', name: 'Idaho' },
      { id: 'IL', name: 'Illinois' }, { id: 'IN', name: 'Indiana' }, { id: 'IA', name: 'Iowa' }, { id: 'KS', name: 'Kansas' },
      { id: 'KY', name: 'Kentucky' }, { id: 'LA', name: 'Louisiana' }, { id: 'ME', name: 'Maine' }, { id: 'MD', name: 'Maryland' },
      { id: 'MA', name: 'Massachusetts' }, { id: 'MI', name: 'Michigan' }, { id: 'MN', name: 'Minnesota' }, { id: 'MS', name: 'Mississippi' },
      { id: 'MO', name: 'Missouri' }, { id: 'MT', name: 'Montana' }, { id: 'NE', name: 'Nebraska' }, { id: 'NV', name: 'Nevada' },
      { id: 'NH', name: 'New Hampshire' }, { id: 'NJ', name: 'New Jersey' }, { id: 'NM', name: 'New Mexico' }, { id: 'NY', name: 'New York' },
      { id: 'NC', name: 'North Carolina' }, { id: 'ND', name: 'North Dakota' }, { id: 'OH', name: 'Ohio' }, { id: 'OK', name: 'Oklahoma' },
      { id: 'OR', name: 'Oregon' }, { id: 'PA', name: 'Pennsylvania' }, { id: 'RI', name: 'Rhode Island' }, { id: 'SC', name: 'South Carolina' },
      { id: 'SD', name: 'South Dakota' }, { id: 'TN', name: 'Tennessee' }, { id: 'TX', name: 'Texas' }, { id: 'UT', name: 'Utah' },
      { id: 'VT', name: 'Vermont' }, { id: 'VA', name: 'Virginia' }, { id: 'WA', name: 'Washington' }, { id: 'WV', name: 'West Virginia' },
      { id: 'WI', name: 'Wisconsin' }, { id: 'WY', name: 'Wyoming' },
    ],
    CA: [
      { id: 'AB', name: 'Alberta' }, { id: 'BC', name: 'British Columbia' }, { id: 'MB', name: 'Manitoba' }, { id: 'NB', name: 'New Brunswick' },
      { id: 'NL', name: 'Newfoundland and Labrador' }, { id: 'NS', name: 'Nova Scotia' }, { id: 'NT', name: 'Northwest Territories' }, { id: 'NU', name: 'Nunavut' },
      { id: 'ON', name: 'Ontario' }, { id: 'PE', name: 'Prince Edward Island' }, { id: 'QC', name: 'Quebec' }, { id: 'SK', name: 'Saskatchewan' },
      { id: 'YT', name: 'Yukon' },
    ],
    GB: [
      { id: 'ENG', name: 'England' }, { id: 'SCT', name: 'Scotland' }, { id: 'WLS', name: 'Wales' }, { id: 'NIR', name: 'Northern Ireland' },
    ],
    IE: [
      { id: 'L', name: 'Leinster' }, { id: 'M', name: 'Munster' }, { id: 'C', name: 'Connacht' }, { id: 'U', name: 'Ulster' },
    ],
    AU: [
      { id: 'NSW', name: 'New South Wales' }, { id: 'VIC', name: 'Victoria' }, { id: 'QLD', name: 'Queensland' }, { id: 'WA', name: 'Western Australia' },
      { id: 'SA', name: 'South Australia' }, { id: 'TAS', name: 'Tasmania' }, { id: 'ACT', name: 'Australian Capital Territory' }, { id: 'NT', name: 'Northern Territory' },
    ],
    NZ: [
      { id: 'AUK', name: 'Auckland' }, { id: 'BOP', name: 'Bay of Plenty' }, { id: 'CAN', name: 'Canterbury' }, { id: 'GIS', name: 'Gisborne' },
      { id: 'HKB', name: 'Hawke’s Bay' }, { id: 'MWT', name: 'Manawatū-Whanganui' }, { id: 'MBH', name: 'Marlborough' }, { id: 'NSN', name: 'Nelson' },
      { id: 'NTL', name: 'Northland' }, { id: 'OTA', name: 'Otago' }, { id: 'STL', name: 'Southland' }, { id: 'TKI', name: 'Taranaki' },
      { id: 'TAS', name: 'Tasman' }, { id: 'WKO', name: 'Waikato' }, { id: 'WGN', name: 'Wellington' }, { id: 'WTC', name: 'West Coast' },
    ],
  }), []);

  const countryOptions = useMemo(() => englishCountries.map(c => ({ value: c.id, label: c.name })), [englishCountries]);
  const stateOptions = useMemo(() => (formData.country ? (statesByCountry[formData.country] || []).map(s => ({ value: s.id, label: s.name })) : []), [formData.country, statesByCountry]);

  const selectedCountryName = useMemo(() => (
    englishCountries.find(c => c.id === formData.country)?.name || 'Select a country...'
  ), [englishCountries, formData.country]);

  const selectedStateName = useMemo(() => (
    stateOptions.find(s => s.value === formData.state)?.label || 'Select a state...'
  ), [stateOptions, formData.state]);

  const handleChange = (field: keyof FormData) => (value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await formsAPI.submitComplexForm({ type: 'dynamic-dropdown', data: formData });
      setSubmitSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
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
          <h2 className="text-2xl font-bold text-green-900 mb-2">Form Submitted Successfully!</h2>
          <p className="text-green-700">Redirecting to dashboard in 3 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dynamic Dropdown Form</h1>
        <p className="text-gray-600 mb-8">Country and state panels render locally without AJAX. Click the arrows to reveal options.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <ULListbox
                  value={formData.country}
                  onChange={(val) => setFormData(prev => ({ ...prev, country: val, state: '' }))}
                  options={countryOptions}
                  placeholder="Select a country..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <ULListbox
                  value={formData.state}
                  onChange={(val) => setFormData(prev => ({ ...prev, state: val }))}
                  options={stateOptions}
                  disabled={!formData.country}
                  placeholder={formData.country ? 'Select a state...' : 'Select a country first'}
                />
              </div>
            </div>
          </div>

          {/* Department Section (updated to ULListbox) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <ULListbox
                  value={formData.department}
                  onChange={(val) => setFormData(prev => ({ ...prev, department: val, team: '' }))}
                  options={[{ value: 'eng', label: 'Engineering' }, { value: 'sales', label: 'Sales' }, { value: 'marketing', label: 'Marketing' }]}
                  placeholder="Select a department..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <ULListbox
                  value={formData.team}
                  onChange={(val) => setFormData(prev => ({ ...prev, team: val }))}
                  options={
                    formData.department === 'eng' ? [{ value: 'frontend', label: 'Frontend' }, { value: 'backend', label: 'Backend' }] :
                    formData.department === 'sales' ? [{ value: 'enterprise', label: 'Enterprise' }, { value: 'smb', label: 'SMB' }] :
                    formData.department === 'marketing' ? [{ value: 'content', label: 'Content' }, { value: 'demand', label: 'Demand Gen' }] : []
                  }
                  disabled={!formData.department}
                  placeholder={formData.department ? 'Select a team...' : 'Select a department first'}
                />
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Comments</label>
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
            <h3 className="text-sm font-medium text-gray-900 mb-2">Current Form State (Debug)</h3>
            <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(formData, null, 2)}</pre>
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
              disabled={isSubmitting || !formData.country}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicDropdownFormPage;

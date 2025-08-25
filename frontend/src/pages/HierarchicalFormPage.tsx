import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HierarchicalDropdown from '../components/dropdowns/HierarchicalDropdown';
import { formsAPI } from '../services/api';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormData {
  categories: string[];
  skills: string[];
  locations: string[];
  comments: string;
}

const HierarchicalFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    categories: [],
    skills: [],
    locations: [],
    comments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Hierarchical options for categories
  const categoryOptions = [
    {
      value: 'technology',
      label: 'Technology',
      children: [
        {
          value: 'frontend',
          label: 'Frontend Development',
          parent: 'technology',
          children: [
            { value: 'react', label: 'React', parent: 'frontend' },
            { value: 'angular', label: 'Angular', parent: 'frontend' },
            { value: 'vue', label: 'Vue.js', parent: 'frontend' },
          ],
        },
        {
          value: 'backend',
          label: 'Backend Development',
          parent: 'technology',
          children: [
            { value: 'node', label: 'Node.js', parent: 'backend' },
            { value: 'python', label: 'Python', parent: 'backend' },
            { value: 'java', label: 'Java', parent: 'backend' },
          ],
        },
        {
          value: 'mobile',
          label: 'Mobile Development',
          parent: 'technology',
          children: [
            { value: 'ios', label: 'iOS', parent: 'mobile' },
            { value: 'android', label: 'Android', parent: 'mobile' },
            { value: 'react-native', label: 'React Native', parent: 'mobile' },
          ],
        },
      ],
    },
    {
      value: 'design',
      label: 'Design',
      children: [
        {
          value: 'ui-design',
          label: 'UI Design',
          parent: 'design',
          children: [
            { value: 'web-design', label: 'Web Design', parent: 'ui-design' },
            { value: 'mobile-design', label: 'Mobile Design', parent: 'ui-design' },
          ],
        },
        {
          value: 'ux-design',
          label: 'UX Design',
          parent: 'design',
          children: [
            { value: 'user-research', label: 'User Research', parent: 'ux-design' },
            { value: 'prototyping', label: 'Prototyping', parent: 'ux-design' },
          ],
        },
      ],
    },
  ];

  // Hierarchical options for skills
  const skillOptions = [
    {
      value: 'programming',
      label: 'Programming Languages',
      children: [
        { value: 'javascript', label: 'JavaScript', parent: 'programming' },
        { value: 'typescript', label: 'TypeScript', parent: 'programming' },
        { value: 'python', label: 'Python', parent: 'programming' },
        { value: 'java', label: 'Java', parent: 'programming' },
        { value: 'csharp', label: 'C#', parent: 'programming' },
      ],
    },
    {
      value: 'frameworks',
      label: 'Frameworks & Libraries',
      children: [
        {
          value: 'js-frameworks',
          label: 'JavaScript Frameworks',
          parent: 'frameworks',
          children: [
            { value: 'react-framework', label: 'React', parent: 'js-frameworks' },
            { value: 'angular-framework', label: 'Angular', parent: 'js-frameworks' },
            { value: 'vue-framework', label: 'Vue.js', parent: 'js-frameworks' },
          ],
        },
        {
          value: 'backend-frameworks',
          label: 'Backend Frameworks',
          parent: 'frameworks',
          children: [
            { value: 'express', label: 'Express.js', parent: 'backend-frameworks' },
            { value: 'django', label: 'Django', parent: 'backend-frameworks' },
            { value: 'spring', label: 'Spring', parent: 'backend-frameworks' },
          ],
        },
      ],
    },
  ];

  // Hierarchical options for locations
  const locationOptions = [
    {
      value: 'north-america',
      label: 'North America',
      children: [
        {
          value: 'usa',
          label: 'United States',
          parent: 'north-america',
          children: [
            {
              value: 'california',
              label: 'California',
              parent: 'usa',
              children: [
                { value: 'san-francisco', label: 'San Francisco', parent: 'california' },
                { value: 'los-angeles', label: 'Los Angeles', parent: 'california' },
                { value: 'san-diego', label: 'San Diego', parent: 'california' },
              ],
            },
            {
              value: 'new-york',
              label: 'New York',
              parent: 'usa',
              children: [
                { value: 'nyc', label: 'New York City', parent: 'new-york' },
                { value: 'buffalo', label: 'Buffalo', parent: 'new-york' },
              ],
            },
          ],
        },
        {
          value: 'canada',
          label: 'Canada',
          parent: 'north-america',
          children: [
            {
              value: 'ontario',
              label: 'Ontario',
              parent: 'canada',
              children: [
                { value: 'toronto', label: 'Toronto', parent: 'ontario' },
                { value: 'ottawa', label: 'Ottawa', parent: 'ontario' },
              ],
            },
          ],
        },
      ],
    },
    {
      value: 'europe',
      label: 'Europe',
      children: [
        {
          value: 'uk',
          label: 'United Kingdom',
          parent: 'europe',
          children: [
            { value: 'london', label: 'London', parent: 'uk' },
            { value: 'manchester', label: 'Manchester', parent: 'uk' },
          ],
        },
        {
          value: 'germany',
          label: 'Germany',
          parent: 'europe',
          children: [
            { value: 'berlin', label: 'Berlin', parent: 'germany' },
            { value: 'munich', label: 'Munich', parent: 'germany' },
          ],
        },
      ],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await formsAPI.submitComplexForm({
        type: 'hierarchical',
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
          Hierarchical Multi-Select Form
        </h1>
        <p className="text-gray-600 mb-8">
          This form demonstrates hierarchical multi-select dropdowns with parent-child 
          relationships. Selecting a parent automatically selects all its children, 
          and selecting all children automatically selects the parent.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <HierarchicalDropdown
            label="Categories"
            name="categories"
            value={formData.categories}
            onChange={(value) => setFormData(prev => ({ ...prev, categories: value }))}
            options={categoryOptions}
            placeholder="Select categories..."
            required
            showFullPath
          />

          <HierarchicalDropdown
            label="Skills"
            name="skills"
            value={formData.skills}
            onChange={(value) => setFormData(prev => ({ ...prev, skills: value }))}
            options={skillOptions}
            placeholder="Select skills..."
            required
            showFullPath
          />

          <HierarchicalDropdown
            label="Preferred Locations"
            name="locations"
            value={formData.locations}
            onChange={(value) => setFormData(prev => ({ ...prev, locations: value }))}
            options={locationOptions}
            placeholder="Select locations..."
            showFullPath
          />

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
              disabled={isSubmitting || formData.categories.length === 0 || formData.skills.length === 0}
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
          Hierarchical Selection Features
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click the arrow to expand/collapse categories</li>
          <li>• Selecting a parent selects all its children</li>
          <li>• Deselecting a parent deselects all its children</li>
          <li>• When all children are selected, the parent is automatically selected</li>
          <li>• Full path is shown for selected items (e.g., "Technology > Frontend > React")</li>
          <li>• Multiple hierarchy levels are supported</li>
        </ul>
      </div>
    </div>
  );
};

export default HierarchicalFormPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressiveDropdown from '../components/dropdowns/ProgressiveDropdown';
import { formDataAPI, formsAPI } from '../services/api';
import { SelectOption, PaginatedResponse } from '../types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormData {
  jobTitles: string[];
  skills: string[];
  interests: string;
}

const ProgressiveLoadingFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    jobTitles: [],
    skills: [],
    interests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadJobTitles = async (params: {
    search: string;
    limit: number;
    offset: number;
  }): Promise<PaginatedResponse<SelectOption>> => {
    const response = await formDataAPI.getJobTitles(params);
    return {
      items: response.items.map((job: any) => ({
        value: job.id,
        label: job.name,
        meta: `${job.department} - ${job.level}`,
      })),
      total: response.total,
      hasMore: response.hasMore,
    };
  };

  const loadSkills = async (params: {
    search: string;
    limit: number;
    offset: number;
  }): Promise<PaginatedResponse<SelectOption>> => {
    const response = await formDataAPI.getSkills({
      ...params,
      category: '', // Could be filtered by category
    });
    return {
      items: response.items.map((skill: any) => ({
        value: skill.id,
        label: skill.name,
        meta: skill.category,
      })),
      total: response.total,
      hasMore: response.hasMore,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await formsAPI.submitComplexForm({
        type: 'progressive-loading',
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
          Progressive Loading Form
        </h1>
        <p className="text-gray-600 mb-8">
          This form demonstrates progressive loading dropdowns that handle large 
          datasets efficiently. Type to search and scroll to load more results. 
          The dropdowns load data incrementally as you scroll.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProgressiveDropdown
            label="Job Titles (Multi-select)"
            name="jobTitles"
            value={formData.jobTitles}
            onChange={(value) => setFormData(prev => ({ ...prev, jobTitles: value as string[] }))}
            loadOptions={loadJobTitles}
            placeholder="Type to search job titles..."
            required
            isMulti
            pageSize={30}
            debounceMs={300}
          />

          <ProgressiveDropdown
            label="Skills (Multi-select)"
            name="skills"
            value={formData.skills}
            onChange={(value) => setFormData(prev => ({ ...prev, skills: value as string[] }))}
            loadOptions={loadSkills}
            placeholder="Type to search skills..."
            required
            isMulti
            pageSize={20}
            debounceMs={300}
          />

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Career Interests
            </label>
            <textarea
              value={formData.interests}
              onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Tell us about your career interests..."
            />
          </div>

          {/* Selected Values Display */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Selected Job Titles ({formData.jobTitles.length})
              </h3>
              {formData.jobTitles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.jobTitles.map((jobId) => (
                    <span
                      key={jobId}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {jobId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No job titles selected</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Selected Skills ({formData.skills.length})
              </h3>
              {formData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skillId) => (
                    <span
                      key={skillId}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {skillId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No skills selected</p>
              )}
            </div>
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
              disabled={isSubmitting || formData.jobTitles.length === 0 || formData.skills.length === 0}
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
          Progressive Loading Features
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Type to search through 500+ job titles</li>
          <li>• Results load progressively as you scroll</li>
          <li>• Debounced search to reduce API calls</li>
          <li>• Selected values are preserved even if not in current search</li>
          <li>• Metadata (department, level) shown for context</li>
          <li>• Infinite scroll loads more results automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default ProgressiveLoadingFormPage;

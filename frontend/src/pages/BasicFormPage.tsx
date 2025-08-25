import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { formsAPI } from '../services/api';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface BasicFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  employmentStatus: string;
  experience: string;
  education: string;
  skills: string[];
  availability: string;
  comments: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

const BasicFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BasicFormData>({
    defaultValues: {
      skills: [],
      agreeToTerms: false,
      subscribeNewsletter: true,
    },
  });

  const onSubmit = async (data: BasicFormData) => {
    setIsSubmitting(true);
    try {
      await formsAPI.submitBasicForm(data);
      setSubmitSuccess(true);
      console.log('Form submitted:', data);
      
      // Reset form after 3 seconds
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

  const employmentStatus = watch('employmentStatus');

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Basic Form Example</h1>
        <p className="text-gray-600 mb-8">
          This form demonstrates basic HTML form elements including text inputs, 
          radio buttons, checkboxes, select dropdowns, and textarea.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <select
                    {...register('state')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    {...register('zipCode')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('country', { required: 'Country is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a country...</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Status <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="employed"
                    {...register('employmentStatus', { required: 'Please select employment status' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Currently Employed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="unemployed"
                    {...register('employmentStatus', { required: 'Please select employment status' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Not Currently Employed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="student"
                    {...register('employmentStatus', { required: 'Please select employment status' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Student</span>
                </label>
              </div>
              {errors.employmentStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.employmentStatus.message}</p>
              )}
            </div>

            {employmentStatus === 'employed' && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  Please provide details about your current employment in the comments section below.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <select
                  {...register('experience')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Highest Education
                </label>
                <select
                  {...register('education')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                  <option value="high-school">High School</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (check all that apply)
            </label>
            <div className="space-y-2">
              {['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL'].map((skill) => (
                <label key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    value={skill}
                    {...register('skills')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When can you start?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="immediately"
                  {...register('availability')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Immediately</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="2-weeks"
                  {...register('availability')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">2 weeks notice</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="1-month"
                  {...register('availability')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">1 month or more</span>
              </label>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Comments
            </label>
            <textarea
              {...register('comments')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Tell us more about yourself..."
            />
          </div>

          {/* Terms and Newsletter */}
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                {...register('agreeToTerms', { required: 'You must agree to the terms' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <label className="ml-2 text-sm text-gray-700">
                I agree to the terms and conditions <span className="text-red-500">*</span>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="ml-6 text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}

            <div className="flex items-start">
              <input
                type="checkbox"
                {...register('subscribeNewsletter')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <label className="ml-2 text-sm text-gray-700">
                Subscribe to our newsletter for updates
              </label>
            </div>
          </div>

          {/* Hidden fields example */}
          <input type="hidden" value="basic-form" {...register('formType' as any)} />
          <input type="hidden" value={new Date().toISOString()} {...register('submittedAt' as any)} />

          {/* Submit Button */}
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
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>

      {/* Form Elements Outside Main Form (Example) */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          Example: Elements Outside Form Container
        </h3>
        <p className="text-sm text-yellow-700">
          This panel demonstrates elements that appear outside the main form container
          but might still be related to the form context. This pattern is common in
          complex job application forms.
        </p>
      </div>
    </div>
  );
};

export default BasicFormPage;

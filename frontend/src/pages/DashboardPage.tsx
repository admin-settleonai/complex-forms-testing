import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const formCategories = [
    {
      title: 'Basic Forms',
      description: 'Simple form elements and validation',
      forms: [
        {
          name: 'Basic Form',
          description: 'Text inputs, radio buttons, checkboxes, and basic validation',
          href: '/forms/basic',
          difficulty: 'Easy',
          color: 'bg-green-100 text-green-800',
        },
      ],
    },
    {
      title: 'Dynamic Forms',
      description: 'Forms with dynamic loading and dependencies',
      forms: [
        {
          name: 'Dynamic Dropdowns',
          description: 'Country/State cascading dropdowns with API loading',
          href: '/forms/dynamic-dropdown',
          difficulty: 'Medium',
          color: 'bg-yellow-100 text-yellow-800',
        },
        {
          name: 'Hierarchical Select',
          description: 'Multi-level hierarchical selection with parent-child relationships',
          href: '/forms/hierarchical',
          difficulty: 'Medium',
          color: 'bg-yellow-100 text-yellow-800',
        },
        {
          name: 'Progressive Loading',
          description: 'Large datasets with search and infinite scroll',
          href: '/forms/progressive-loading',
          difficulty: 'Hard',
          color: 'bg-red-100 text-red-800',
        },
      ],
    },
    {
      title: 'Complex Forms',
      description: 'Advanced form patterns and workflows',
      forms: [
        {
          name: 'Multi-page Form',
          description: 'Step-by-step form with progress tracking and session management',
          href: '/forms/multi-page',
          difficulty: 'Hard',
          color: 'bg-red-100 text-red-800',
        },
        {
          name: 'Complex Integration',
          description: 'Combines all patterns in a single comprehensive form',
          href: '/forms/complex-integration',
          difficulty: 'Expert',
          color: 'bg-purple-100 text-purple-800',
        },
      ],
    },
    {
      title: 'Platform-Specific Forms',
      description: 'Forms mimicking popular job platforms',
      forms: [
        {
          name: 'Workday Style',
          description: 'Replicates Workday\'s unique form patterns and ARIA dropdowns',
          href: '/forms/workday-style',
          difficulty: 'Expert',
          color: 'bg-purple-100 text-purple-800',
        },
        {
          name: 'Greenhouse Style',
          description: 'Multi-step application form with Greenhouse patterns',
          href: '/forms/greenhouse-style',
          difficulty: 'Hard',
          color: 'bg-red-100 text-red-800',
        },
        {
          name: 'Lever Style',
          description: 'Dynamic field loading and modern UI patterns from Lever',
          href: '/forms/lever-style',
          difficulty: 'Hard',
          color: 'bg-red-100 text-red-800',
        },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.firstName}!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Test complex form patterns from popular job application platforms
        </p>
      </div>

      <div className="space-y-8">
        {formCategories.map((category) => (
          <div key={category.title}>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {category.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.forms.map((form) => (
                <Link
                  key={form.name}
                  to={form.href}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {form.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {form.description}
                      </p>
                    </div>
                    <span
                      className={`ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${form.color}`}
                    >
                      {form.difficulty}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg bg-blue-50 p-6">
        <h3 className="text-lg font-medium text-blue-900">Testing Tips</h3>
        <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-blue-700">
          <li>Start with basic forms to understand the patterns</li>
          <li>Dynamic forms demonstrate real-world API interactions</li>
          <li>Complex forms combine multiple patterns together</li>
          <li>Platform-specific forms replicate actual job site behaviors</li>
          <li>Check the browser console for detailed form submission data</li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardPage;

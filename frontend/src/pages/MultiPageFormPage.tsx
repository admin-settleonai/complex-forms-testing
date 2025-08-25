import React from 'react';
import { useNavigate } from 'react-router-dom';

const MultiPageFormPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Multi-Page Form</h1>
        <p className="text-gray-600 mb-8">
          Multi-page form implementation coming soon...
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MultiPageFormPage;

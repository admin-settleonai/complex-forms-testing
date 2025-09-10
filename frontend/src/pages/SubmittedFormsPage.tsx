import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formsAPI } from '../services/api';

type Submission = {
  id: string;
  userId: number | string;
  formKind?: string;
  type?: string;
  data: any;
  submittedAt: string;
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const SubmittedFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ type: string; kind: string; from: string; to: string; q: string }>({ type: '', kind: '', from: '', to: '', q: '' });

  const selected = useMemo(() => submissions.find(s => s.id === selectedId) || null, [submissions, selectedId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.type) params.type = filters.type;
      if (filters.kind) params.kind = filters.kind;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.q) params.q = filters.q;
      const list = await formsAPI.getSubmissions(params);
      setSubmissions(Array.isArray(list) ? list : []);
    } catch (e) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submitted Forms</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>

      {loading && (
        <div className="bg-white shadow rounded-lg p-6 text-sm text-gray-600">Loading submissions…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-4">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 bg-white shadow rounded-lg divide-y divide-gray-100">
            <div className="p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">All Submissions ({submissions.length})</h2>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Type</label>
                  <input
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="e.g. dynamic-dropdown"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Kind</label>
                  <select
                    value={filters.kind}
                    onChange={(e) => setFilters(prev => ({ ...prev, kind: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Any</option>
                    <option value="basic">basic</option>
                    <option value="complex">complex</option>
                    <option value="multipage">multipage</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">From</label>
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">To</label>
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Search</label>
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                    placeholder="search in data JSON"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); load(); }}
                    className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Apply
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); setFilters({ type: '', kind: '', from: '', to: '', q: '' }); setSelectedId(null); setSubmissions([]); load(); }}
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
            <ul className="max-h-[32rem] overflow-auto">
              {submissions.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedId === s.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.type || s.formKind || 'submission'}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(s.submittedAt)}</p>
                      </div>
                      <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {s.formKind || 'form'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
              {submissions.length === 0 && (
                <li className="px-4 py-6 text-sm text-gray-500">No submissions yet.</li>
              )}
            </ul>
          </div>

          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Details</h2>
            </div>
            <div className="p-4">
              {selected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Submission ID</p>
                      <p className="text-sm text-gray-900 break-all">{selected.id}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Submitted At</p>
                      <p className="text-sm text-gray-900">{formatDateTime(selected.submittedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Kind</p>
                      <p className="text-sm text-gray-900">{selected.formKind || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                      <p className="text-sm text-gray-900">{selected.type || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Form Data</p>
                    <pre className="text-xs bg-gray-50 rounded-md p-3 overflow-auto max-h-[40rem]">{JSON.stringify(selected.data, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Select a submission to view details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmittedFormsPage;



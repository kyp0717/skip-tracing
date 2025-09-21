'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SkipTracePage() {
  const [docketNumber, setDocketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    if (!docketNumber) {
      setError('Please enter a docket number');
      return;
    }

    setChecking(true);
    setError('');
    setStatus(null);

    try {
      const response = await fetch(`/api/defendants/skip-trace?docket_number=${encodeURIComponent(docketNumber)}`);
      const data = await response.json();

      if (response.ok) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to check status');
      }
    } catch (err) {
      setError('Failed to check skip trace status');
    } finally {
      setChecking(false);
    }
  };

  const performSkipTrace = async () => {
    if (!docketNumber) {
      setError('Please enter a docket number');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/defendants/skip-trace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docket_number: docketNumber,
          limit: 50 // Process up to 50 defendants
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        // Refresh status after processing
        await checkStatus();
      } else {
        setError(data.error || 'Skip trace failed');
      }
    } catch (err) {
      setError('Failed to perform skip trace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="text-gray-600 hover:text-gray-800 mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Skip Trace</h1>
        <p className="text-gray-600 mt-2">
          Look up phone numbers for defendants using BatchData API
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="docketNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Docket Number
            </label>
            <input
              type="text"
              id="docketNumber"
              value={docketNumber}
              onChange={(e) => setDocketNumber(e.target.value.toUpperCase())}
              placeholder="e.g., FBT-CV-24-6135862-S"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={checkStatus}
              disabled={checking || !docketNumber}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {checking ? 'Checking...' : 'Check Status'}
            </button>

            <button
              onClick={performSkipTrace}
              disabled={loading || !docketNumber}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Run Skip Trace'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Status Display */}
        {status && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-3">Skip Trace Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Defendants:</span>
                <span className="font-medium">{status.total_defendants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With Skip Trace Data:</span>
                <span className="font-medium text-green-600">{status.defendants_with_skip_trace}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coverage:</span>
                <span className="font-medium">{status.coverage_percentage}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.coverage_percentage}%` }}
                />
              </div>
            </div>

            {/* Defendants List */}
            {status.defendants && status.defendants.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Defendants:</h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-2 py-1">Name</th>
                        <th className="text-left px-2 py-1">Address</th>
                        <th className="text-center px-2 py-1">Skip Traces</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.defendants.map((defendant: any) => (
                        <tr key={defendant.id} className="border-t">
                          <td className="px-2 py-1">{defendant.name}</td>
                          <td className="px-2 py-1 text-gray-600 text-xs">
                            {defendant.address || 'No address'}
                          </td>
                          <td className="px-2 py-1 text-center">
                            {defendant.skip_trace_count > 0 ? (
                              <span className="text-green-600">✓ {defendant.skip_trace_count}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-3">Skip Trace Results</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Processed:</span>
                <span className="font-medium">{results.processed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Successful:</span>
                <span className="font-medium text-green-600">{results.successful}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skipped:</span>
                <span className="font-medium text-yellow-600">{results.skipped}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium text-red-600">{results.failed}</span>
              </div>
            </div>

            {/* Detailed Results */}
            {results.results && results.results.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Details:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.results.map((result: any, index: number) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{result.name}:</span>{' '}
                      <span className={
                        result.status === 'success' ? 'text-green-600' :
                        result.status === 'skipped' ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {result.status}
                      </span>
                      {result.reason && <span className="text-gray-500"> - {result.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {results.errors && results.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Errors:</h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {results.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-600">
                      {error.name}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
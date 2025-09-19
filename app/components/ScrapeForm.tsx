'use client';

import { useState, useEffect } from 'react';

interface Town {
  id: number;
  town: string;
  county?: string;
  created_at?: string;
  [key: string]: any;
}

export default function ScrapeForm() {
  const [town, setTown] = useState('');
  const [towns, setTowns] = useState<Town[]>([]);
  const [loadingTowns, setLoadingTowns] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchTowns = async () => {
      try {
        const response = await fetch('/api/towns');
        const data = await response.json();
        if (data.towns) {
          setTowns(data.towns);
        }
      } catch (error) {
        console.error('Failed to fetch towns:', error);
      } finally {
        setLoadingTowns(false);
      }
    };

    fetchTowns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ town }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to scrape data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Scrape Foreclosure Cases</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">
            Town Name
          </label>
          {loadingTowns ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              Loading towns...
            </div>
          ) : (
            <select
              id="town"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a Connecticut town</option>
              {towns.map((t) => (
                <option key={t.id} value={t.town}>
                  {t.town} {t.county ? `(${t.county} County)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || loadingTowns}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Scraping...' : 'Start Scraping'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 rounded-md bg-gray-50">
          {result.error ? (
            <p className="text-red-600">Error: {result.error}</p>
          ) : (
            <div>
              <p className="text-green-600 font-semibold">Success!</p>
              <p>Cases scraped: {result.stats?.cases_scraped || 0}</p>
              <p>Defendants found: {result.stats?.defendants_scraped || 0}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
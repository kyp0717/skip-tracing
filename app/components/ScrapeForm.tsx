'use client';

import { useState, useEffect } from 'react';
import { CasesTable } from './CasesTable';

interface Town {
  id: number;
  town: string;
  county?: string;
  created_at?: string;
  [key: string]: any;
}

export default function ScrapeForm() {
  const [activeTab, setActiveTab] = useState<'town' | 'county' | 'viewTown' | 'viewCounty'>('town');
  const [town, setTown] = useState('');
  const [county, setCounty] = useState('');
  const [viewTown, setViewTown] = useState('');
  const [viewCounty, setViewCounty] = useState('');
  const [towns, setTowns] = useState<Town[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);
  const [loadingTowns, setLoadingTowns] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchTowns = async () => {
      try {
        const response = await fetch('/api/towns');
        const data = await response.json();
        if (data.towns) {
          setTowns(data.towns);
          // Extract unique counties
          const uniqueCounties = Array.from(new Set(data.towns.map((t: Town) => t.county).filter(Boolean))) as string[];
          uniqueCounties.sort();
          setCounties(uniqueCounties);
        }
      } catch (error) {
        console.error('Failed to fetch towns:', error);
      } finally {
        setLoadingTowns(false);
      }
    };

    const fetchAvailableLocations = async () => {
      try {
        const response = await fetch('/api/cases/available-locations');
        const data = await response.json();
        if (data.towns) {
          setAvailableTowns(data.towns);
        }
        if (data.counties) {
          setAvailableCounties(data.counties);
        }
      } catch (error) {
        console.error('Failed to fetch available locations:', error);
      } finally {
        setLoadingAvailable(false);
      }
    };

    fetchTowns();
    fetchAvailableLocations();
  }, []);

  const handleTownSubmit = async (e: React.FormEvent) => {
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

  const handleCountySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ county }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to scrape data' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/cases?town=${encodeURIComponent(viewTown)}`);
      const data = await response.json();

      if (data.cases) {
        setResult({
          stats: {
            cases_found: data.cases.length,
            message: 'Viewing existing cases'
          },
          cases: data.cases
        });
      } else {
        setResult({ error: 'No cases found for this town' });
      }
    } catch (error) {
      setResult({ error: 'Failed to fetch cases' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCountySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Get all towns in the county first
      const townsInCounty = towns.filter(t => t.county === viewCounty).map(t => t.town);

      const response = await fetch(`/api/cases?county=${encodeURIComponent(viewCounty)}`);
      const data = await response.json();

      if (data.cases) {
        setResult({
          stats: {
            cases_found: data.cases.length,
            message: `Viewing cases from ${townsInCounty.length} towns in ${viewCounty} County`
          },
          cases: data.cases
        });
      } else {
        setResult({ error: 'No cases found for this county' });
      }
    } catch (error) {
      setResult({ error: 'Failed to fetch cases' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => {setActiveTab('town'); setResult(null);}}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'town'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Scrape by Town
        </button>
        <button
          onClick={() => {setActiveTab('county'); setResult(null);}}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'county'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Scrape by County
        </button>
        <button
          onClick={() => {setActiveTab('viewTown'); setResult(null);}}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'viewTown'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          View by Town
        </button>
        <button
          onClick={() => {setActiveTab('viewCounty'); setResult(null);}}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'viewCounty'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          View by County
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Town Form */}
        {activeTab === 'town' && (
          <form onSubmit={handleTownSubmit} className="space-y-4">
            <div>
              <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">
                Select Town
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a town</option>
                  {towns.map((t) => (
                    <option key={t.id} value={t.town}>
                      {t.town}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loadingTowns}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Scraping...' : 'Scrape'}
            </button>
          </form>
        )}

        {/* County Form */}
        {activeTab === 'county' && (
          <form onSubmit={handleCountySubmit} className="space-y-4">
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                Select County
              </label>
              {loadingTowns ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading counties...
                </div>
              ) : (
                <select
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a county</option>
                  {counties.map((c) => (
                    <option key={c} value={c}>
                      {c} County
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loadingTowns}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Scraping...' : 'Scrape'}
            </button>
          </form>
        )}

        {/* View Town Form */}
        {activeTab === 'viewTown' && (
          <form onSubmit={handleViewTownSubmit} className="space-y-4">
            <div>
              <label htmlFor="viewTown" className="block text-sm font-medium text-gray-700 mb-2">
                Select Town (with existing cases)
              </label>
              {loadingAvailable ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading available towns...
                </div>
              ) : availableTowns.length > 0 ? (
                <select
                  id="viewTown"
                  value={viewTown}
                  onChange={(e) => setViewTown(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a town</option>
                  {availableTowns.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                  No towns with cases available
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loadingAvailable || availableTowns.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'View'}
            </button>
          </form>
        )}

        {/* View County Form */}
        {activeTab === 'viewCounty' && (
          <form onSubmit={handleViewCountySubmit} className="space-y-4">
            <div>
              <label htmlFor="viewCounty" className="block text-sm font-medium text-gray-700 mb-2">
                Select County (with existing cases)
              </label>
              {loadingAvailable ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading available counties...
                </div>
              ) : availableCounties.length > 0 ? (
                <select
                  id="viewCounty"
                  value={viewCounty}
                  onChange={(e) => setViewCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a county</option>
                  {availableCounties.map((c) => (
                    <option key={c} value={c}>
                      {c} County
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                  No counties with cases available
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loadingAvailable || availableCounties.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'View'}
            </button>
          </form>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Show summary for all tabs */}
            <div className="mt-6 p-4 rounded-md bg-gray-50 border border-gray-200">
              {result.error ? (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600">{result.error}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-600 font-semibold">
                      {result.stats?.message || 'Successfully Scraped!'}
                    </p>
                  </div>
                  <div className="ml-7 space-y-1">
                    {result.stats?.cases_scraped !== undefined ? (
                      <>
                        <p className="text-gray-700">Cases found: <span className="font-medium">{result.stats.cases_scraped}</span></p>
                        <p className="text-gray-700">Defendants identified: <span className="font-medium">{result.stats.defendants_scraped || 0}</span></p>
                      </>
                    ) : (
                      <p className="text-gray-700">Cases found: <span className="font-medium">{result.stats?.cases_found || 0}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Show data table for view tabs when cases are available */}
            {(activeTab === 'viewTown' || activeTab === 'viewCounty') && result.cases && result.cases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Cases Details</h3>
                <CasesTable cases={result.cases} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
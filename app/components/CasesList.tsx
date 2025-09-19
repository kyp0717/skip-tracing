'use client';

import { useEffect, useState } from 'react';

interface Case {
  id: number;
  case_name: string;
  docket_number: string;
  docket_url: string;
  town: string;
  created_at: string;
}

export default function CasesList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading cases...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">Recent Cases</h2>

      {cases.length === 0 ? (
        <p className="text-gray-500">No cases found. Start by scraping a town.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border-b text-left">Docket Number</th>
              <th className="px-4 py-2 border-b text-left">Case Name</th>
              <th className="px-4 py-2 border-b text-left">Town</th>
              <th className="px-4 py-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{c.docket_number}</td>
                <td className="px-4 py-2 border-b">{c.case_name}</td>
                <td className="px-4 py-2 border-b">{c.town}</td>
                <td className="px-4 py-2 border-b">
                  {c.docket_url && (
                    <a
                      href={c.docket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
export function SkipTracesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Skip Traces</h2>
        <p className="text-gray-600 mt-1">Manage skip trace lookups and results</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900">Total Lookups</h3>
            <p className="text-2xl font-bold text-purple-600 mt-1">0</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-indigo-900">Successful Traces</h3>
            <p className="text-2xl font-bold text-indigo-600 mt-1">0</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-pink-900">Total Cost</h3>
            <p className="text-2xl font-bold text-pink-600 mt-1">$0.00</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Skip Traces</h3>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              New Skip Trace
            </button>
          </div>
          <p className="text-gray-500">No skip traces found. Start a new lookup to begin.</p>
        </div>
      </div>
    </div>
  )
}
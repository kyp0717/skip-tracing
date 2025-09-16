export function CourtCasesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Court Cases</h2>
        <p className="text-gray-600 mt-1">Manage and view foreclosure court cases</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">Total Cases</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">0</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900">Active Cases</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">0</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-900">Pending Review</h3>
            <p className="text-2xl font-bold text-yellow-600 mt-1">0</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Cases</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add New Case
            </button>
          </div>
          <p className="text-gray-500">No cases found. Add your first case to get started.</p>
        </div>
      </div>
    </div>
  )
}
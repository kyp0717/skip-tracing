import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Foreclosure Case Management System</h2>
          <p className="text-gray-600">Connecticut Judiciary Case Scraping and Skip Trace Services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/scrape" className="group p-8 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold ml-4 group-hover:text-blue-600 transition-colors">Scrape Cases</h3>
            </div>
            <p className="text-gray-600">Extract and view cases</p>
          </Link>

          <div className="group p-8 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-not-allowed opacity-75">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold ml-4 text-gray-500">Skip Trace</h3>
            </div>
            <p className="text-gray-500">Look up phone numbers</p>
            <span className="inline-block mt-2 text-sm font-medium text-gray-400 bg-gray-200 px-3 py-1 rounded-full">Coming Soon</span>
          </div>
        </div>
    </div>
  )
}
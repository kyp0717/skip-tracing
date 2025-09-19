import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Skip Trace System</h1>
        <p className="mb-4">Foreclosure case scraping and skip trace system for Connecticut</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Link href="/scrape" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">Scrape Cases</h2>
            <p>Search and scrape foreclosure cases by town</p>
          </Link>

          <Link href="/cases" className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-semibold mb-2">View Data</h2>
            <p>Browse cases and defendant information</p>
          </Link>

          <div className="p-6 border rounded-lg bg-gray-100">
            <h2 className="text-xl font-semibold mb-2">Skip Trace</h2>
            <p>Lookup phone numbers for defendants (Coming soon)</p>
          </div>
        </div>
      </div>
    </main>
  )
}
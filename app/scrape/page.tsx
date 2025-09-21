import ScrapeForm from '../components/ScrapeForm';

export default function ScrapePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Scrape Foreclosure Cases</h1>
      <ScrapeForm />
    </div>
  );
}
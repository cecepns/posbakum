import { useState, useEffect } from 'react';
import { Map } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import InteractiveMap from '@/components/map/InteractiveMap';

export default function HomeMapSection() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(API_ENDPOINTS.MAP_LOCATIONS.PUBLIC)
      .then((res) => setLocations(res.data.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-2">
          <Map className="h-7 w-7 text-primary-600" />
          <h2 className="text-center text-2xl font-bold text-slate-900">Peta Jarak & Tarif Perkara</h2>
        </div>
        <p className="mt-2 text-center text-slate-500">
          Klik titik pada peta untuk melihat informasi jarak dan tarif biaya perkara
        </p>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : error ? (
            <EmptyState title="Peta tidak dapat dimuat" description="Silakan muat ulang halaman atau coba lagi nanti." />
          ) : locations.length === 0 ? (
            <EmptyState title="Belum ada data lokasi" description="Admin dapat menambahkan titik lokasi dari panel Peta GIS." />
          ) : (
            <InteractiveMap locations={locations} className="h-[380px] md:h-[440px] w-full rounded-xl shadow-sm" />
          )}
        </div>

        {!loading && locations.length > 0 && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Peta © OpenStreetMap contributors
          </p>
        )}
      </div>
    </section>
  );
}

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/mapLocation';

export default function FitMapBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!locations?.length) {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      return;
    }
    if (locations.length === 1) {
      const loc = locations[0];
      map.setView([Number(loc.latitude), Number(loc.longitude)], 14);
      return;
    }
    const bounds = L.latLngBounds(
      locations.map((loc) => [Number(loc.latitude), Number(loc.longitude)])
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [locations, map]);

  return null;
}

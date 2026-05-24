import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import '@/utils/leafletIcon';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/mapLocation';

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      map.setView([Number(lat), Number(lng)], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onChange, className = 'h-[280px] w-full rounded-lg' }) {
  const hasCoords = latitude != null && longitude != null && latitude !== '' && longitude !== '';
  const center = hasCoords
    ? [Number(latitude), Number(longitude)]
    : DEFAULT_MAP_CENTER;

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">Klik pada peta untuk menentukan koordinat lokasi</p>
      <div className={`overflow-hidden border border-slate-300 ${className}`}>
        <MapContainer center={center} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelect={onChange} />
          {hasCoords && (
            <>
              <Marker position={[Number(latitude), Number(longitude)]} />
              <RecenterMap lat={latitude} lng={longitude} />
            </>
          )}
        </MapContainer>
      </div>
      {hasCoords && (
        <p className="mt-2 text-xs text-slate-600">
          Koordinat: <span className="font-mono">{Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}</span>
        </p>
      )}
    </div>
  );
}

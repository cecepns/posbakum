import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '@/utils/leafletIcon';
import FitMapBounds from '@/components/map/FitMapBounds';
import MapLocationPopup from '@/components/map/MapLocationPopup';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/mapLocation';

export default function InteractiveMap({
  locations = [],
  className = 'h-[360px] w-full rounded-xl',
  scrollWheelZoom = true,
}) {
  const center = locations.length
    ? [Number(locations[0].latitude), Number(locations[0].longitude)]
    : DEFAULT_MAP_CENTER;

  return (
    <div className={`overflow-hidden border border-slate-200 ${className}`}>
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapBounds locations={locations} />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[Number(loc.latitude), Number(loc.longitude)]}>
            <Popup>
              <MapLocationPopup location={loc} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

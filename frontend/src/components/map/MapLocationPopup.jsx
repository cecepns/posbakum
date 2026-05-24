import { MapPin, Route, Scale, FileText } from 'lucide-react';
import { formatDistance, getLocationTypeLabel } from '@/utils/mapLocation';

export default function MapLocationPopup({ location }) {
  const distance = formatDistance(location);

  return (
    <div className="min-w-[200px] max-w-[280px] text-sm text-slate-800">
      <p className="font-semibold text-primary-800">{location.name}</p>
      <p className="mt-0.5 text-xs text-slate-500">{getLocationTypeLabel(location.location_type)}</p>
      {location.address && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
          <MapPin size={14} className="mt-0.5 shrink-0 text-primary-600" />
          <span>{location.address}</span>
        </p>
      )}
      {distance && (
        <p className="mt-2 flex items-center gap-1.5 text-xs">
          <Route size={14} className="shrink-0 text-amber-600" />
          <span><strong>Jarak:</strong> {distance}</span>
        </p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-xs">
        <Scale size={14} className="mt-0.5 shrink-0 text-primary-600" />
        <span><strong>Tarif biaya perkara:</strong> {location.case_fee}</span>
      </p>
      {location.case_type && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
          <FileText size={14} className="mt-0.5 shrink-0" />
          <span><strong>Jenis perkara:</strong> {location.case_type}</span>
        </p>
      )}
      {location.fee_notes && (
        <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">{location.fee_notes}</p>
      )}
      {location.description && (
        <p className="mt-2 text-xs text-slate-500">{location.description}</p>
      )}
    </div>
  );
}

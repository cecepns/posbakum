export const LOCATION_TYPES = [
  { value: 'posbakum', label: 'Posbakum' },
  { value: 'pengadilan', label: 'Pengadilan' },
  { value: 'zona', label: 'Zona / Wilayah' },
];

export const getLocationTypeLabel = (type) =>
  LOCATION_TYPES.find((t) => t.value === type)?.label || type;

export const formatDistance = (loc) => {
  if (loc.distance_info) return loc.distance_info;
  if (loc.distance_km != null && loc.distance_km !== '') {
    const km = Number(loc.distance_km);
    if (km === 0) return 'Lokasi referensi (0 km)';
    return `±${km} km`;
  }
  return null;
};

export const DEFAULT_MAP_CENTER = [-6.8886, 109.675];
export const DEFAULT_MAP_ZOOM = 13;

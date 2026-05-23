import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';

export function useLayananCatalog(group, { includeInactive = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(API_ENDPOINTS.LAYANAN_CATALOG.LIST, {
      params: { group, limit: 100, include_inactive: includeInactive ? 'true' : '' },
    })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [group, includeInactive]);

  const bySlug = items.reduce((acc, item) => {
    acc[item.slug] = item.name;
    return acc;
  }, {});

  return { items, bySlug, loading };
}

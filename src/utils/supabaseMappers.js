/** Shared Supabase column parsing and insert/UI shapes (website + app). */

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) {
    try {
      const j = JSON.parse(value);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parsePhotosColumn(raw) {
  if (!raw) return [];
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function photoUrl(p) {
  if (!p) return '';
  if (typeof p === 'string') return p;
  return p.url ?? p.base64 ?? '';
}

export function serviceRowHeroThumb(row) {
  const photos = parsePhotosColumn(row.photos);
  const first = photos[0];
  if (first == null) return '';
  if (typeof first === 'string') return first;
  return first.base64 || first.url || '';
}

export function normalizeTourPhotosForInsert(photosArr) {
  const arr = Array.isArray(photosArr) ? photosArr : [];
  if (!arr.length) return [];
  const withMain = arr.map((p, i) => ({ ...p, isMain: p.isMain || i === 0 }));
  withMain.sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
  return withMain;
}

export function mapOfferUiRow(o) {
  const name = o.provider_name;
  return {
    id: o.id,
    provider_id: o.provider_id,
    providerId: o.provider_id,
    provider_name: name,
    provider: name,
    price: o.price,
    description: o.description,
    status: o.status,
  };
}

export function indexOffersByRequestId(rows) {
  const by = {};
  for (const o of rows || []) {
    const rid = o.request_id;
    if (!by[rid]) by[rid] = [];
    by[rid].push(mapOfferUiRow(o));
  }
  return by;
}

export function touristShortName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  return parts[0] || 'Tourist';
}

export function newRequestInsertPayload(user, form) {
  return {
    id: `#REQ-${String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0')}`,
    tourist_id: user.id,
    tourist_name: user.name,
    avatar: user.avatar ?? (user.name || '').slice(0, 2).toUpperCase(),
    title: form.title.trim(),
    description: form.desc.trim() || null,
    region: form.region,
    type: form.type,
    date: form.date || null,
    budget: Number(form.budget) || 0,
    status: 'open',
  };
}

export function bookingInsertFromOffer(user, request, offer) {
  return {
    tourist_id: user.id,
    tourist_name: touristShortName(user?.name),
    service_name: request.title || 'Custom request',
    provider_id: offer.providerId ?? offer.provider_id,
    provider_name: offer.provider ?? offer.provider_name,
    date: request.date || 'TBD',
    amount: offer.price,
    status: 'confirmed',
    reviewed: false,
  };
}

export function bookingInsertFromTour(user, tour) {
  const providerId = tour.providerId ?? tour.provider_id;
  const today = new Date().toISOString().slice(0, 10);
  return {
    tourist_id: user.id,
    tourist_name: touristShortName(user.name),
    service_name: tour.name,
    provider_id: providerId,
    provider_name: tour.provider || '',
    date: today,
    amount: tour.price ?? 0,
    status: 'confirmed',
    reviewed: false,
  };
}

export function providerOfferInsertPayload(user, requestId, offerForm) {
  return {
    request_id: requestId,
    provider_id: user.id,
    provider_name: user.name || '',
    provider_avatar: user.avatar ?? null,
    provider_color: user.color ?? null,
    price: Number(offerForm.price) || 0,
    duration: offerForm.duration || null,
    description: offerForm.msg || '',
    status: 'pending',
  };
}

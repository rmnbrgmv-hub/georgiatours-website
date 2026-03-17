import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import {
  normalizeTourPhotosForInsert,
  parseJsonArray,
  parsePhotosColumn,
} from '../utils/supabaseMappers';

export function toServicesRow(tour, user) {
  const providerName = user ? user.name : tour.provider;
  const photosArr = Array.isArray(tour.photos) ? tour.photos : [];
  const normalizedPhotos = normalizeTourPhotosForInsert(photosArr);
  const price = Number(tour.price) || 0;
  return {
    name: tour.name,
    provider_name: providerName,
    provider_id: user?.id ?? tour.providerId,
    type: tour.type,
    duration: tour.duration || '',
    price,
    rating: tour.rating ?? 0,
    reviews: tour.reviews ?? 0,
    tags: Array.isArray(tour.tags) ? tour.tags : [],
    emoji: tour.emoji ?? '🏛️',
    description: tour.desc ?? tour.description ?? '',
    area: tour.area ?? tour.region ?? 'Tbilisi',
    region: tour.region ?? 'Tbilisi',
    available: tour.available ?? [],
    max_seats: Number(tour.maxSeats),
    booked_seats: tour.bookedSeats ?? 0,
    total_bookings: tour.total_bookings ?? 0,
    photos: normalizedPhotos.length ? JSON.stringify(normalizedPhotos) : null,
  };
}

export function mapServiceRow(row) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider_name,
    providerId: row.provider_id,
    type: row.type,
    duration: row.duration,
    price: row.price,
    rating: row.rating,
    reviews: row.reviews,
    tags: row.tags ?? [],
    emoji: row.emoji,
    desc: row.description,
    area: row.area,
    region: row.region,
    available: row.available ?? [],
    maxSeats: row.max_seats ?? undefined,
    bookedSeats: row.booked_seats ?? undefined,
    total_bookings: row.total_bookings ?? 0,
    photos: parsePhotosColumn(row.photos),
    updatedAt: row.updated_at ?? null,
    suspended: !!row.suspended,
  };
}

export function mapRequestRow(row) {
  return {
    id: row.id,
    touristId: row.tourist_id,
    tourist: row.tourist_name,
    avatar: row.avatar,
    title: row.title,
    desc: row.description,
    region: row.region,
    type: row.type,
    date: row.date,
    budget: row.budget,
    status: row.status,
    offers: row.offers ?? [],
    createdAt: row.created_at ?? row.createdAt ?? '',
  };
}

export function mapBookingRow(row) {
  return {
    id: row.id,
    touristId: row.tourist_id,
    tourist: row.tourist_name,
    serviceId: row.service_id,
    service: row.service_name,
    providerId: row.provider_id,
    provider: row.provider_name,
    date: row.date,
    amount: row.amount,
    status: row.status || 'confirmed',
    reviewed: !!row.reviewed,
    createdAt: row.created_at,
    updated_at: row.updated_at,
  };
}

export function isProviderUser(user) {
  return (
    user?.role === 'provider' ||
    user?.provider_type === 'guide' ||
    user?.provider_type === 'transfer' ||
    user?.type === 'guide' ||
    user?.type === 'transfer'
  );
}

export function mapUserRow(row) {
  const type = row.provider_type ?? undefined;
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    role: row.role ?? 'tourist',
    type,
    provider_type: row.provider_type ?? undefined,
    avatar:
      row.avatar ??
      (row.name ? row.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : ''),
    color: row.color ?? undefined,
    bio: row.bio ?? '',
    rating: row.rating ?? 0,
    totalBookings: row.total_bookings ?? 0,
    earnings: row.earnings ?? '₾0',
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    vehicleYear: row.vehicle_year,
    vehicleColor: row.vehicle_color,
    vehiclePlate: row.vehicle_plate,
    maxSeats: row.max_seats,
    verified: !!row.verified,
    badges: parseJsonArray(row.badges),
    profile_picture: row.profile_picture ?? row.profilePic ?? null,
    gallery: parseJsonArray(row.gallery),
  };
}

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      const { data, error: e } = await supabase.from('services').select('*');
      if (e) {
        setError(e);
        setServices([]);
        setLoading(false);
        return;
      }
      setServices((data || []).map(mapServiceRow));
    } catch {
      setServices([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id,name,email,avatar,color,role,provider_type,verified,badges');
      if (!alive) return;
      if (error) {
        setUsers([]);
        setLoading(false);
        return;
      }
      setUsers((data || []).map(mapUserRow));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { users, loading };
}

export function useRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase.from('requests').select('*');
    if (e) {
      setError(e);
      setRequests([]);
      setLoading(false);
      return;
    }
    setRequests((data || []).map(mapRequestRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests };
}

export function useOpenRequests() {
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('requests').select('*').eq('status', 'open');
      if (!alive) return;
      if (error) {
        setOpenRequests([]);
        setLoading(false);
        return;
      }
      setOpenRequests((data || []).map(mapRequestRow));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { openRequests, loading };
}

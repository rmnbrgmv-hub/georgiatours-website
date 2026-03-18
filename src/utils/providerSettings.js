import { parseJsonArray } from './supabaseMappers';

const DEFAULT_AVAILABILITY = {
  type: 'always',
  unavailable_dates: [],
  working_days: [1, 2, 3, 4, 5],
  max_bookings_per_day: 1,
  notice_hours: 24,
};

function findSettingsBadge(badges) {
  if (!Array.isArray(badges)) return null;
  return badges.find((b) => b && typeof b === 'object' && b._type === 'settings') || null;
}

export function getUserSettingsFromBadges(rawBadges) {
  const badges = parseJsonArray(rawBadges);
  const settings = findSettingsBadge(badges);
  if (!settings) {
    return {
      availability: { ...DEFAULT_AVAILABILITY },
      provider_mode: 'individual',
      company_name: '',
      team_size: 1,
    };
  }
  return {
    availability: { ...DEFAULT_AVAILABILITY, ...(settings.availability || {}) },
    provider_mode: settings.provider_mode || 'individual',
    company_name: settings.company_name || '',
    team_size: settings.team_size || 1,
  };
}

export function buildBadgesWithSettings(rawBadges, settings) {
  const baseBadges = parseJsonArray(rawBadges).filter(
    (b) => !(b && typeof b === 'object' && b._type === 'settings')
  );
  const settingsBadge = {
    _type: 'settings',
    availability: settings.availability || { ...DEFAULT_AVAILABILITY },
    provider_mode: settings.provider_mode || 'individual',
    company_name: settings.company_name || '',
    team_size: settings.team_size || 1,
  };
  return [...baseBadges, settingsBadge];
}

export function getAvailabilityStatusForDate(settings, requestedDate) {
  if (!requestedDate) {
    return { available: true, text: 'Available' };
  }
  const avail = settings?.availability || DEFAULT_AVAILABILITY;
  const isoDate = new Date(requestedDate).toISOString().slice(0, 10);

  if (Array.isArray(avail.unavailable_dates) && avail.unavailable_dates.includes(isoDate)) {
    return { available: false, text: 'Unavailable on this date' };
  }

  if (avail.type === 'weekdays') {
    const day = new Date(requestedDate).getDay();
    if (![1, 2, 3, 4, 5].includes(day)) {
      return { available: false, text: 'Available weekdays only' };
    }
  }

  if (avail.notice_hours) {
    const hoursUntil = (new Date(requestedDate) - new Date()) / 3600000;
    if (hoursUntil < avail.notice_hours) {
      return { available: false, text: `Needs ${avail.notice_hours}h advance notice` };
    }
  }

  return { available: true, text: 'Available' };
}

export function getDailyCapacity(settings) {
  const avail = settings?.availability || DEFAULT_AVAILABILITY;
  const maxPerPerson = avail.max_bookings_per_day || 1;
  const teamSize = settings?.provider_mode === 'company' ? settings.team_size || 1 : 1;
  return maxPerPerson * teamSize;
}

/** Short line for tour cards (today). */
export function getTourCardAvailabilityLine(rawBadges) {
  const today = new Date().toISOString().slice(0, 10);
  const settings = getUserSettingsFromBadges(rawBadges);
  const st = getAvailabilityStatusForDate(settings, today);
  if (!st.available) return { text: st.text, ok: false };
  if (settings.provider_mode === 'company') {
    return { text: `Company · ${settings.team_size || 1} guides/drivers`, ok: true };
  }
  return { text: 'Available today', ok: true };
}


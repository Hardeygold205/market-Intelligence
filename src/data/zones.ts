/**
 * Geopolitical zones lookup for Nigerian states
 */

export const STATE_TO_ZONE: Record<string, string> = {
  // North Central
  'Benue': 'North Central',
  'FCT': 'North Central',
  'Federal Capital Territory': 'North Central',
  'Kogi': 'North Central',
  'Kwara': 'North Central',
  'Nasarawa': 'North Central',
  'Niger': 'North Central',
  'Plateau': 'North Central',

  // North East
  'Adamawa': 'North East',
  'Bauchi': 'North East',
  'Borno': 'North East',
  'Gombe': 'North East',
  'Taraba': 'North East',
  'Yobe': 'North East',

  // North West
  'Jigawa': 'North West',
  'Kaduna': 'North West',
  'Kano': 'North West',
  'Katsina': 'North West',
  'Kebbi': 'North West',
  'Sokoto': 'North West',
  'Zamfara': 'North West',

  // South East
  'Abia': 'South East',
  'Anambra': 'South East',
  'Ebonyi': 'South East',
  'Enugu': 'South East',
  'Imo': 'South East',

  // South South
  'Akwa Ibom': 'South South',
  'Bayelsa': 'South South',
  'Cross River': 'South South',
  'Delta': 'South South',
  'Edo': 'South South',
  'Rivers': 'South South',

  // South West
  'Ekiti': 'South West',
  'Lagos': 'South West',
  'Ogun': 'South West',
  'Ondo': 'South West',
  'Osun': 'South West',
  'Oyo': 'South West'
};

export const GEOPOLITICAL_ZONES = [
  'North Central',
  'North East',
  'North West',
  'South East',
  'South South',
  'South West'
] as const;

export function getZoneForState(state: string): string {
  if (!state) return 'Unknown Zone';
  const trimmed = state.trim();
  return STATE_TO_ZONE[trimmed] || 'Other';
}

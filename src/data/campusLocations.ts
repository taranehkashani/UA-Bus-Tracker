import { CampusLocation } from '../types/transit';

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  // Academic & Student Life
  {
    id: 'loc_ferguson',
    name: 'Ferguson Student Center',
    category: 'transit_hub',
    latitude: 33.2152,
    longitude: -87.5415,
    nearestStopId: 'stop_ferguson',
    aliases: ['ferg', 'student center', 'the ferg', 'starbucks', 'food court', 'supe store'],
    description: 'Central campus union, dining, bookstore, and transit plaza.'
  },
  {
    id: 'loc_shelby_hall',
    name: 'Shelby Hall (Engineering Quad)',
    category: 'academic',
    latitude: 33.2144,
    longitude: -87.5315,
    nearestStopId: 'stop_engineering_quad',
    aliases: ['shelby', 'engineering building', 'serc', 'nerc', 'engineering quad', 'rodgers library'],
    description: 'College of Engineering headquarters, chemistry labs, research centers.'
  },
  {
    id: 'loc_gorgas_library',
    name: 'Gorgas Library / The Quad',
    category: 'library',
    latitude: 33.2126,
    longitude: -87.5412,
    nearestStopId: 'stop_gorgas_quad',
    aliases: ['gorgas', 'the quad', 'main library', 'denny chimes', 'quad'],
    description: 'Primary campus academic library overlooking the historic Quad and Denny Chimes.'
  },
  {
    id: 'loc_north_lawn',
    name: 'North Lawn Hall',
    category: 'academic',
    latitude: 33.2163,
    longitude: -87.5352,
    nearestStopId: 'stop_north_lawn',
    aliases: ['north lawn', 'nlh', 'math building', 'lecture hall'],
    description: 'Major classroom auditorium hall and math department facilities.'
  },
  {
    id: 'loc_rec_center',
    name: 'Student Recreation Center',
    category: 'athletics',
    latitude: 33.2198,
    longitude: -87.5358,
    nearestStopId: 'stop_presidential_village',
    aliases: ['rec center', 'the rec', 'gym', 'src', 'outdoor pool', 'climbing wall', 'workout'],
    description: 'Main campus recreation and fitness complex, indoor pools, basketball courts.'
  },
  {
    id: 'loc_bryant_denny',
    name: 'Bryant-Denny Stadium',
    category: 'athletics',
    latitude: 33.2084,
    longitude: -87.5498,
    nearestStopId: 'stop_stadium_commuter',
    aliases: ['stadium', 'football stadium', 'bds', 'walk of champions', 'bryant denny', 'game day'],
    description: 'Iconic home of Crimson Tide Football, 100,000+ seat stadium.'
  },
  {
    id: 'loc_coleman_coliseum',
    name: 'Coleman Coliseum',
    category: 'athletics',
    latitude: 33.2040,
    longitude: -87.5398,
    nearestStopId: 'stop_coleman_coliseum',
    aliases: ['coleman', 'basketball arena', 'gymnastics', 'athletic ticket office'],
    description: 'Home of Crimson Tide Basketball, gymnastics, and athletic administration.'
  },
  {
    id: 'loc_moody_music',
    name: 'Moody Music Building',
    category: 'academic',
    latitude: 33.2114,
    longitude: -87.5318,
    nearestStopId: 'stop_moody_music',
    aliases: ['moody', 'music school', 'concert hall', 'million dollar band'],
    description: 'School of Music, concert halls, Million Dollar Band rehearsal facility.'
  },
  {
    id: 'loc_foster_auditorium',
    name: 'Foster Auditorium',
    category: 'academic',
    latitude: 33.2105,
    longitude: -87.5447,
    nearestStopId: 'stop_foster_auditorium',
    aliases: ['foster', 'farrah hall', 'volleyball', 'historic landmark'],
    description: 'Historic National Historic Landmark, athletics & communications.'
  },
  {
    id: 'loc_nursing_school',
    name: 'Capstone College of Nursing',
    category: 'academic',
    latitude: 33.2132,
    longitude: -87.5255,
    nearestStopId: 'stop_nursing_umc',
    aliases: ['nursing', 'nursing building', 'ccn', 'health sciences'],
    description: 'Nursing simulation suites and clinical learning center.'
  },
  {
    id: 'loc_umc',
    name: 'University Medical Center (UMC)',
    category: 'dining',
    latitude: 33.2138,
    longitude: -87.5240,
    nearestStopId: 'stop_nursing_umc',
    aliases: ['umc', 'student health', 'clinic', 'medical center', 'doctor'],
    description: 'Campus outpatient health clinic and medical care.'
  },
  {
    id: 'loc_bryce_campus',
    name: 'Bryce Performing Arts Center',
    category: 'academic',
    latitude: 33.2178,
    longitude: -87.5276,
    nearestStopId: 'stop_bryce_campus',
    aliases: ['bryce', 'theatre', 'dance', 'performing arts'],
    description: 'UA Department of Theatre and Dance, rehearsal halls, stage theaters.'
  },

  // Residence Halls & Dorms
  {
    id: 'loc_ridgecrest_south',
    name: 'Ridgecrest South',
    category: 'residence',
    latitude: 33.2176,
    longitude: -87.5416,
    nearestStopId: 'stop_ridgecrest',
    aliases: ['ridgecrest', 'ridgecrest south', 'rcs', 'honors dorm', 'ridgecrest dorms'],
    description: 'Honors College residential community on North Campus.'
  },
  {
    id: 'loc_ridgecrest_west',
    name: 'Ridgecrest West',
    category: 'residence',
    latitude: 33.2182,
    longitude: -87.5422,
    nearestStopId: 'stop_ridgecrest',
    aliases: ['ridgecrest west', 'rcw'],
    description: 'Residential community suites with quick access to McCorvey.'
  },
  {
    id: 'loc_tutwiler_hall',
    name: 'Tutwiler Hall',
    category: 'residence',
    latitude: 33.2079,
    longitude: -87.5450,
    nearestStopId: 'stop_tutwiler',
    aliases: ['tutwiler', 'tut', 'new tutwiler', 'sorority row dorm'],
    description: 'Modern freshman residential hall on 10th Avenue.'
  },
  {
    id: 'loc_presidential_village',
    name: 'Presidential Village',
    category: 'residence',
    latitude: 33.2202,
    longitude: -87.5385,
    nearestStopId: 'stop_presidential_village',
    aliases: ['pres', 'pv1', 'pv2', 'presidential village 1', 'presidential village 2', 'pres dorm'],
    description: 'North campus student residence towers next to the Rec Center.'
  },
  {
    id: 'loc_lakeside_hall',
    name: 'Lakeside Dining & Halls',
    category: 'dining',
    latitude: 33.2186,
    longitude: -87.5360,
    nearestStopId: 'stop_lakeside',
    aliases: ['lakeside', 'lakeside dining', 'dunkin', 'lake dorm'],
    description: 'All-you-care-to-eat dining hall, convenience market, and dorms.'
  },
  {
    id: 'loc_riverside_community',
    name: 'Riverside Community',
    category: 'residence',
    latitude: 33.2193,
    longitude: -87.5428,
    nearestStopId: 'stop_riverside',
    aliases: ['riverside', 'riverside north', 'riverside east', 'riverside west'],
    description: 'Northwest campus apartment-style suites by Black Warrior River.'
  },
  {
    id: 'loc_west_deck',
    name: 'West Commuter Parking Deck',
    category: 'parking',
    latitude: 33.2090,
    longitude: -87.5505,
    nearestStopId: 'stop_stadium_commuter',
    aliases: ['west deck', 'commuter deck', 'stadium parking', 'west parking'],
    description: 'Multi-level commuter student and game-day parking garage.'
  }
];

export const CAMPUS_LOCATION_LOOKUP = new Map<string, CampusLocation>(
  CAMPUS_LOCATIONS.map((loc) => [loc.id, loc])
);

import { Route } from '../types/transit';

export const UA_ROUTES: Route[] = [
  {
    id: 'route_crimson',
    name: 'Crimson Route',
    shortName: 'Crimson',
    color: '#9E1B32', // Official University of Alabama Crimson
    textColor: '#FFFFFF',
    description: 'Central campus loop linking academic quads, libraries, stadium, and student centers.',
    frequencyMinutes: 7,
    operatingHours: '7:00 AM – 10:00 PM (Mon–Fri)',
    directionNames: {
      outbound: 'Academic Quad & Engineering',
      inbound: 'The Quad & Bryant-Denny'
    },
    stopIds: [
      'stop_ferguson',
      'stop_north_lawn',
      'stop_engineering_quad',
      'stop_moody_music',
      'stop_foster_auditorium',
      'stop_tutwiler',
      'stop_stadium_commuter',
      'stop_gorgas_quad'
    ],
    shape: [
      [33.2152, -87.5415], // Ferguson Center
      [33.2158, -87.5380], // McCorvey / Campus Dr
      [33.2163, -87.5352], // North Lawn Hall
      [33.2155, -87.5320], // Hackberry Ln turn
      [33.2144, -87.5315], // Engineering Quad / Shelby
      [33.2128, -87.5316], // 2nd Ave / Engineering south
      [33.2114, -87.5318], // Moody Music
      [33.2110, -87.5370], // University Blvd westbound
      [33.2105, -87.5447], // Foster Auditorium
      [33.2085, -87.5448], // 10th Ave south
      [33.2079, -87.5450], // Tutwiler Hall
      [33.2078, -87.5485], // Paul W Bryant Dr westbound
      [33.2084, -87.5498], // Bryant-Denny Stadium
      [33.2105, -87.5495], // Wallace Wade Ave north
      [33.2120, -87.5450], // University Blvd toward Quad
      [33.2126, -87.5412], // Gorgas Library / The Quad
      [33.2145, -87.5414], // McCorvey Dr north
      [33.2152, -87.5415]  // Return to Ferguson
    ]
  },
  {
    id: 'route_blue',
    name: 'Blue Route',
    shortName: 'Blue',
    color: '#1D4ED8', // Royal Transit Blue
    textColor: '#FFFFFF',
    description: 'Residential corridor express linking North Campus housing, Rec Center, and classroom halls.',
    frequencyMinutes: 8,
    operatingHours: '7:00 AM – 9:00 PM (Mon–Fri)',
    directionNames: {
      outbound: 'Engineering & Ferguson Center',
      inbound: 'Presidential Village & Rec Center'
    },
    stopIds: [
      'stop_presidential_village',
      'stop_lakeside',
      'stop_ridgecrest',
      'stop_riverside',
      'stop_ferguson',
      'stop_north_lawn',
      'stop_engineering_quad'
    ],
    shape: [
      [33.2202, -87.5385], // Presidential Village
      [33.2195, -87.5370], // Campus Drive
      [33.2186, -87.5360], // Lakeside Dining
      [33.2180, -87.5390], // Riverside loop road
      [33.2176, -87.5416], // Ridgecrest
      [33.2193, -87.5428], // Riverside Community
      [33.2170, -87.5425], // McCorvey Dr southbound
      [33.2152, -87.5415], // Ferguson Student Center
      [33.2163, -87.5352], // North Lawn Hall
      [33.2144, -87.5315], // Engineering Quad (Shelby Hall)
      [33.2158, -87.5325], // Hackberry north
      [33.2185, -87.5355], // Toward Lakeside
      [33.2202, -87.5385]  // Back to Presidential Village
    ]
  },
  {
    id: 'route_green',
    name: 'Green Route',
    shortName: 'Green',
    color: '#059669', // Emerald Green
    textColor: '#FFFFFF',
    description: 'East campus and health sciences loop linking Nursing, UMC, Bryce Campus, and Athletics.',
    frequencyMinutes: 12,
    operatingHours: '7:15 AM – 7:30 PM (Mon–Fri)',
    directionNames: {
      outbound: 'Nursing & Bryce Campus',
      inbound: 'Coleman Coliseum & Athletics'
    },
    stopIds: [
      'stop_engineering_quad',
      'stop_nursing_umc',
      'stop_bryce_campus',
      'stop_moody_music',
      'stop_coleman_coliseum'
    ],
    shape: [
      [33.2144, -87.5315], // Engineering Quad
      [33.2140, -87.5280], // University Blvd East
      [33.2132, -87.5255], // Capstone Nursing / UMC
      [33.2160, -87.5260], // Peter Bryce Blvd north
      [33.2178, -87.5276], // Bryce Campus
      [33.2150, -87.5300], // Returning south
      [33.2114, -87.5318], // Moody Music
      [33.2080, -87.5350], // 2nd Ave South
      [33.2040, -87.5398], // Coleman Coliseum
      [33.2070, -87.5380], // Hackberry North
      [33.2114, -87.5318], // Moody Music
      [33.2144, -87.5315]  // Return to Engineering
    ]
  },
  {
    id: 'route_yellow',
    name: 'Yellow Route',
    shortName: 'Yellow',
    color: '#D97706', // Amber Gold
    textColor: '#FFFFFF',
    description: 'Perimeter commuter shuttle connecting commuter parking decks to The Quad and Ferguson Center.',
    frequencyMinutes: 10,
    operatingHours: '7:00 AM – 6:00 PM (Mon–Fri)',
    directionNames: {
      outbound: 'Ferguson Center & The Quad',
      inbound: 'Stadium Commuter Deck & Coleman'
    },
    stopIds: [
      'stop_stadium_commuter',
      'stop_gorgas_quad',
      'stop_ferguson',
      'stop_foster_auditorium',
      'stop_coleman_coliseum'
    ],
    shape: [
      [33.2084, -87.5498], // Bryant-Denny Stadium / West Deck
      [33.2110, -87.5470], // University Blvd
      [33.2126, -87.5412], // The Quad / Gorgas Library
      [33.2152, -87.5415], // Ferguson Student Center
      [33.2130, -87.5440], // University Blvd
      [33.2105, -87.5447], // Foster Auditorium
      [33.2070, -87.5420], // Hackberry south
      [33.2040, -87.5398], // Coleman Coliseum
      [33.2050, -87.5460], // Bryant Dr west
      [33.2084, -87.5498]  // Stadium West Deck
    ]
  },
  {
    id: 'route_bronze',
    name: 'Bronze Evening Express',
    shortName: 'Bronze',
    color: '#78350F', // Warm UA Bronze
    textColor: '#FFFFFF',
    description: 'Comprehensive evening campus loop connecting dorms, dining halls, and academic facilities.',
    frequencyMinutes: 15,
    operatingHours: '6:00 PM – 1:00 AM (Daily)',
    directionNames: {
      outbound: 'North Campus Housing & Dining',
      inbound: 'South Campus Dorms & Ferguson'
    },
    stopIds: [
      'stop_tutwiler',
      'stop_ferguson',
      'stop_ridgecrest',
      'stop_riverside',
      'stop_presidential_village',
      'stop_lakeside',
      'stop_engineering_quad'
    ],
    shape: [
      [33.2079, -87.5450], // Tutwiler
      [33.2110, -87.5430], // 10th Ave / Quad perimeter
      [33.2152, -87.5415], // Ferguson Center
      [33.2176, -87.5416], // Ridgecrest
      [33.2193, -87.5428], // Riverside
      [33.2202, -87.5385], // Presidential Village
      [33.2186, -87.5360], // Lakeside
      [33.2144, -87.5315], // Engineering Quad
      [33.2100, -87.5370], // Southbound
      [33.2079, -87.5450]  // Tutwiler
    ]
  }
];

export const ROUTE_LOOKUP = new Map<string, Route>(
  UA_ROUTES.map((route) => [route.id, route])
);

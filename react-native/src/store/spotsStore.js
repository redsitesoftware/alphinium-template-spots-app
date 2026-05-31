/**
 * Spots — local state store using Zustand.
 * Demo data included so the app works out of the box with no backend.
 */
import { create } from 'zustand';

export const CATEGORIES = [
  { id: 'all',     label: 'All',      emoji: '🗺️' },
  { id: 'beach',   label: 'Beach',    emoji: '🏖️' },
  { id: 'lookout', label: 'Lookout',  emoji: '🌄' },
  { id: 'hike',    label: 'Hike',     emoji: '🥾' },
  { id: 'cafe',    label: 'Cafe',     emoji: '☕' },
  { id: 'fishing', label: 'Fishing',  emoji: '🎣' },
  { id: 'secret',  label: 'Secret',   emoji: '🤫' },
];

const DEMO_SPOTS = [
  {
    id: '1',
    name: 'Garie Beach',
    category: 'beach',
    lat: -34.2102,
    lng: 151.0635,
    description: 'A quiet beach at the end of a winding road in Royal National Park. Almost always empty on weekdays. The walk down takes 20 mins but it\'s worth it — you usually have the whole beach to yourself.',
    tips: 'No facilities. BYO water. Go at low tide for rock pools at the south end.',
    rating: 4.9,
    saves: 47,
    checkins: 112,
    pinnedBy: 'Sarah K.',
    pinnedAt: '2 days ago',
    tags: ['hidden', 'dog-friendly', 'rock-pools', 'national-park'],
    photos: [],
  },
  {
    id: '2',
    name: 'Sublime Point Lookout',
    category: 'lookout',
    lat: -34.3921,
    lng: 150.5732,
    description: 'Dramatic escarpment views over Wollongong and the coast. Sunrise here is incredible — arrive 30 mins early to get a spot at the railing.',
    tips: 'Best in the morning before the haze rolls in. Free parking on the road.',
    rating: 4.8,
    saves: 83,
    checkins: 241,
    pinnedBy: 'Marcus T.',
    pinnedAt: '5 days ago',
    tags: ['sunrise', 'views', 'photography', 'free-parking'],
    photos: [],
  },
  {
    id: '3',
    name: 'Figure Eight Pools',
    category: 'hike',
    lat: -34.2328,
    lng: 151.0591,
    description: 'Rock pools carved into the cliff face by waves. The hike takes 4 hours return across beautiful coastal heath. Check the swell forecast — only safe when swell is below 1m.',
    tips: 'Check BOM swell before going. Start early (6am) to avoid crowds. Wear solid shoes.',
    rating: 4.7,
    saves: 195,
    checkins: 560,
    pinnedBy: 'Jess L.',
    pinnedAt: '1 week ago',
    tags: ['hiking', 'coastal', 'photography', 'challenging'],
    photos: [],
  },
  {
    id: '4',
    name: 'Pepe\'s on Hunter',
    category: 'cafe',
    lat: -33.8688,
    lng: 151.2093,
    description: 'Tiny courtyard cafe that\'s been here for 20 years. The owner still makes the croissants fresh every morning. Always a queue but moves fast.',
    tips: 'Cash only. The almond croissant sells out by 9am on weekends.',
    rating: 4.6,
    saves: 34,
    checkins: 78,
    pinnedBy: 'Dan W.',
    pinnedAt: '3 days ago',
    tags: ['coffee', 'pastries', 'courtyard', 'cash-only'],
    photos: [],
  },
  {
    id: '5',
    name: 'Narrabeen Lagoon Kayak Launch',
    category: 'fishing',
    lat: -33.7211,
    lng: 151.2982,
    description: 'A quiet spot to launch a kayak or dangle a line. Flathead and bream through the lagoon system. Access is via the walking track — easy 5 min walk from the car park.',
    tips: 'Licence required. Check DPI for bag limits. Early morning best.',
    rating: 4.5,
    saves: 28,
    checkins: 64,
    pinnedBy: 'Ben R.',
    pinnedAt: '1 week ago',
    tags: ['fishing', 'kayaking', 'lagoon', 'quiet'],
    photos: [],
  },
  {
    id: '6',
    name: 'The Mushroom Rock',
    category: 'secret',
    lat: -33.9650,
    lng: 150.9200,
    description: 'A huge mushroom-shaped sandstone formation deep in the bush. Only accessible via an unmarked track off a fire trail. Worth every step.',
    tips: 'Take a compass. Trail markers wear off after rain. Tell someone where you\'re going.',
    rating: 5.0,
    saves: 12,
    checkins: 19,
    pinnedBy: 'Alex M.',
    pinnedAt: '2 weeks ago',
    tags: ['secret', 'geology', 'bushwalk', 'unmarked'],
    photos: [],
  },
  {
    id: '7',
    name: 'Palm Beach North End',
    category: 'beach',
    lat: -33.5994,
    lng: 151.3228,
    description: 'The north tip of Palm Beach past the lighthouse. You can walk here from the main beach at low tide. Usually empty because most people turn back before they reach it.',
    tips: 'Only accessible at low tide. Check tide charts. Bring snorkelling gear.',
    rating: 4.8,
    saves: 56,
    checkins: 134,
    pinnedBy: 'Nina C.',
    pinnedAt: '4 days ago',
    tags: ['hidden', 'snorkelling', 'tide-dependent', 'walk-in'],
    photos: [],
  },
];

export const useSpotsStore = create((set, get) => ({
  spots: DEMO_SPOTS,
  savedSpots: [],
  mySpots: [],
  activeCategory: 'all',
  searchQuery: '',

  setCategory: (category) => set({ activeCategory: category }),
  setSearch: (query) => set({ searchQuery: query }),

  filteredSpots: () => {
    const { spots, activeCategory, searchQuery } = get();
    return spots.filter(s => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q));
      return matchCat && matchSearch;
    });
  },

  toggleSave: (id) => set(state => {
    const already = state.savedSpots.includes(id);
    return { savedSpots: already ? state.savedSpots.filter(s => s !== id) : [...state.savedSpots, id] };
  }),

  isSaved: (id) => get().savedSpots.includes(id),

  addSpot: (spot) => set(state => ({
    spots: [spot, ...state.spots],
    mySpots: [spot.id, ...state.mySpots],
  })),

  getSpotById: (id) => get().spots.find(s => s.id === id),
}));

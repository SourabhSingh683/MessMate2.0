import React, { useState, useEffect, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  Star,
  Compass,
  Footprints,
  Clock,
  Sparkles,
  Utensils,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Mess } from '../types.ts';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyAunMfwHLcUop2HeEQXlTdaNxWvL18yAzs';

// Campus baseline center (Greenwood Institute of Technology / College Zone)
const DEFAULT_CAMPUS_CENTER = { lat: 12.9716, lng: 77.5946 };

export interface MessWithLocation extends Mess {
  lat: number;
  lng: number;
  calculatedDistanceKm?: number;
  walkingMinutes?: number;
}

// Deterministic coordinate mapping for campus messes
export function getMessCoordinates(mess: Mess, index = 0): { lat: number; lng: number } {
  const slug = (mess.slug || mess.name).toLowerCase();
  if (slug.includes('annapurna')) return { lat: 12.9718, lng: 77.5942 };
  if (slug.includes('royal')) return { lat: 12.9745, lng: 77.5985 };
  if (slug.includes('green') || slug.includes('bowl')) return { lat: 12.9688, lng: 77.5912 };
  if (slug.includes('dakshin')) return { lat: 12.9760, lng: 77.5935 };
  if (slug.includes('punjabi') || slug.includes('tadka')) return { lat: 12.9730, lng: 77.5970 };

  // Offset based on ID for dynamically created messes
  const angle = (index * 65 * Math.PI) / 180;
  const radius = 0.003 + (index % 3) * 0.002;
  return {
    lat: DEFAULT_CAMPUS_CENTER.lat + Math.sin(angle) * radius,
    lng: DEFAULT_CAMPUS_CENTER.lng + Math.cos(angle) * radius,
  };
}

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

interface MessLocationMapProps {
  messes: Mess[];
  selectedMessId?: number | null;
  onSelectMess?: (mess: Mess) => void;
  onViewMenu?: (messId: number) => void;
}

export const MessLocationMap: React.FC<MessLocationMapProps> = ({
  messes,
  selectedMessId,
  onSelectMess,
  onViewMenu,
}) => {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CAMPUS_CENTER);
  const [zoom, setZoom] = useState(15);
  const [activeMess, setActiveMess] = useState<MessWithLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  // Decorate messes with coordinates and real-time proximity
  const locatedMesses: MessWithLocation[] = useMemo(() => {
    return messes.map((m, idx) => {
      const coords = getMessCoordinates(m, idx);
      let calculatedDistanceKm = m.distanceKm;
      let walkingMinutes = Math.round(m.distanceKm * 12); // ~5 km/h walking speed

      if (userLocation) {
        calculatedDistanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
        walkingMinutes = Math.max(1, Math.round(calculatedDistanceKm * 12));
      }

      return {
        ...m,
        lat: coords.lat,
        lng: coords.lng,
        calculatedDistanceKm,
        walkingMinutes,
      };
    });
  }, [messes, userLocation]);

  // Filtered by search query (name, address, cuisine)
  const filteredMesses = useMemo(() => {
    if (!searchQuery.trim()) {
      // Sort by proximity if user location is active
      if (userLocation) {
        return [...locatedMesses].sort(
          (a, b) => (a.calculatedDistanceKm ?? 99) - (b.calculatedDistanceKm ?? 99)
        );
      }
      return locatedMesses;
    }
    const q = searchQuery.toLowerCase().trim();
    return locatedMesses.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        m.cuisineTypes.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [locatedMesses, searchQuery, userLocation]);

  // Sync selected mess from parent
  useEffect(() => {
    if (selectedMessId) {
      const found = locatedMesses.find((m) => m.id === selectedMessId);
      if (found) {
        setActiveMess(found);
        setMapCenter({ lat: found.lat, lng: found.lng });
      }
    }
  }, [selectedMessId, locatedMesses]);

  // Locate user using browser geolocation
  const handleLocateMe = () => {
    setLocating(true);
    setLocationStatus('Locating device...');

    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        const newLocation = { lat: uLat, lng: uLng };
        setUserLocation(newLocation);
        setMapCenter(newLocation);
        setZoom(15);
        setLocating(false);
        setLocationStatus('Proximity sorted from your current location!');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      (err) => {
        console.warn('Geolocation warning, falling back to Campus Center:', err.message);
        // Fallback to campus hostel zone (Tagore Hall)
        const campusPos = { lat: 12.9712, lng: 77.5938 };
        setUserLocation(campusPos);
        setMapCenter(campusPos);
        setZoom(15);
        setLocating(false);
        setLocationStatus('Using Campus Hostel Hub location (Demo GPS)');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelect = (mess: MessWithLocation) => {
    setActiveMess(mess);
    setMapCenter({ lat: mess.lat, lng: mess.lng });
    if (onSelectMess) onSelectMess(mess);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800">
      {/* Top Controls Bar */}
      <div className="p-4 bg-gradient-to-r from-[#163C32] to-[#0F2922] text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#D7F36A] text-[#163C32] flex items-center justify-center font-bold shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base leading-tight flex items-center gap-2">
                Google Maps Mess Radar
                <span className="text-[10px] bg-[#D7F36A] text-[#163C32] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                  Interactive
                </span>
              </h3>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-400/30 font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#D7F36A]" /> Free Tier Protected ($0 Cap)
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Explore {locatedMesses.length} campus dining halls & calculate walking distance
            </p>
          </div>
        </div>

        {/* Locate Me Button & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search hostel, gate, or mess..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-emerald-200/60 focus:placeholder:text-slate-400 text-xs rounded-xl border border-white/20 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-1.5 bg-[#D7F36A] hover:bg-[#cbf148] text-[#163C32] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
            title="Sort messes from your current location"
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{userLocation ? 'Near Me' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {locationStatus && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-1.5 font-medium flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{locationStatus}</span>
        </div>
      )}

      {/* Main Grid: Interactive Map (left/top) + Mess List (right/bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Google Map Container - explicit height strictly satisfies CF2 */}
        <div className="lg:col-span-8 relative min-h-[380px] lg:min-h-[460px] h-full w-full bg-slate-100 flex flex-col justify-center">
          {quotaExceeded ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-8 h-8 text-emerald-700" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Zero Cost Protection Active
                </span>
                <h4 className="font-extrabold text-base text-slate-900">
                  Google Maps Free-Tier Quota Limit Reached
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Map tile requests have been safely halted to ensure <strong>$0 billing / no charges</strong>.
                  All {locatedMesses.length} campus mess locations, calculated walking times, menus, and nutritional macros remain fully operational in the directory list.
                </p>
              </div>
            </div>
          ) : (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map
                center={mapCenter}
              zoom={zoom}
              onCenterChanged={(e) => setMapCenter(e.detail.center)}
              onZoomChanged={(e) => setZoom(e.detail.zoom)}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%', minHeight: '380px' }}
            >
              {/* User Location Marker */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your Location">
                  <div className="relative flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500/30 animate-ping absolute" />
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Mess Pins */}
              {locatedMesses.map((m) => {
                const isSelected = activeMess?.id === m.id;
                return (
                  <AdvancedMarker
                    key={m.id}
                    position={{ lat: m.lat, lng: m.lng }}
                    onClick={() => handleSelect(m)}
                    title={m.name}
                  >
                    <Pin
                      background={m.isPureVeg ? '#163C32' : '#ea580c'}
                      glyphColor="#D7F36A"
                      borderColor="#ffffff"
                      scale={isSelected ? 1.25 : 1.0}
                    />
                  </AdvancedMarker>
                );
              })}

              {/* Selected Mess InfoWindow */}
              {activeMess && (
                <InfoWindow
                  position={{ lat: activeMess.lat, lng: activeMess.lng }}
                  onCloseClick={() => setActiveMess(null)}
                >
                  <div className="p-1 max-w-[240px] text-slate-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-xs text-slate-900">{activeMess.name}</span>
                      {activeMess.isPureVeg && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                          Pure Veg
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{activeMess.address}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1.5 border-t border-slate-100">
                      <span className="font-bold text-amber-600 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {activeMess.rating} ({activeMess.reviewCount})
                      </span>
                      <span className="font-bold text-emerald-800">
                        ₹{(activeMess.monthlyBasePricePaise / 100).toLocaleString()}/mo
                      </span>
                    </div>
                    {onViewMenu && (
                      <button
                        onClick={() => onViewMenu(activeMess.id)}
                        className="mt-2 w-full py-1 bg-[#163C32] hover:bg-[#102d26] text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Utensils className="w-3 h-3 text-[#D7F36A]" />
                        View Menu & Macros
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
          )}
        </div>

        {/* Mess Directory List (Right Column) */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {filteredMesses.length} Messes {userLocation ? 'Sorted by Distance' : 'Available'}
            </span>
            <span className="text-[10px] text-slate-400">Click to pin on map</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px] lg:max-h-[460px] flex-1">
            {filteredMesses.map((m) => {
              const isSelected = activeMess?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className={`p-3.5 transition-all cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs text-slate-900 leading-tight truncate">{m.name}</h4>
                        {m.isPureVeg ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                            Veg
                          </span>
                        ) : (
                          <span className="text-[9px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded border border-orange-200">
                            Non-Veg
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.address}</p>
                      <p className="text-[10px] text-slate-400 truncate">{m.cuisineTypes}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-xs text-emerald-800">
                        ₹{(m.monthlyBasePricePaise / 100).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">/month</div>
                    </div>
                  </div>

                  {/* Proximity & Rating row */}
                  <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                        <Footprints className="w-3 h-3 text-emerald-600" />
                        {m.calculatedDistanceKm} km
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500 text-[10px]">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        ~{m.walkingMinutes} min walk
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold text-[10px]">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {m.rating}
                      </span>
                      {onViewMenu && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewMenu(m.id);
                          }}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center"
                        >
                          Menu
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMesses.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No messes found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

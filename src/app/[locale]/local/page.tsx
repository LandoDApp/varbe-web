"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/routing";
import { LocalEvent, ArtistMedium } from "@/types";
import { 
    getLocalArtists, 
    getUpcomingEvents, 
    calculateDistance,
    registerForEvent,
    unregisterFromEvent,
    seedDemoLocations,
    LocalArtistData,
    updateArtistMapVisibility,
    updateArtistLocation,
    getArtistMapVisibility,
    createEvent,
    CreateEventData
} from "@/lib/local";
import { EventCategory } from "@/types";
import { getArtistProfile } from "@/lib/db";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet (SSR issue)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import("react-leaflet").then((mod) => mod.CircleMarker),
    { ssr: false }
);

type MediumFilter = 'all' | ArtistMedium;
type SortOption = 'nearest' | 'recent' | 'followers' | 'alphabetical';
type ContentView = 'artists' | 'events';

const PIN_TYPES: Record<ArtistMedium, { color: string; emoji: string; label: string }> = {
    digital: { color: '#FF4444', emoji: '📍', label: 'Digital Art' },
    traditional: { color: '#4444FF', emoji: '🎨', label: 'Traditional Art' },
    photography: { color: '#44FF44', emoji: '📸', label: 'Photography' },
    illustration: { color: '#FF8800', emoji: '✏️', label: 'Illustration' },
    sculpture: { color: '#8844FF', emoji: '🗿', label: 'Sculpture' },
    mixed: { color: '#FF44FF', emoji: '🎭', label: 'Mixed Media' },
};

// Create custom icon for artist with profile picture
const createArtistIcon = (profilePictureUrl?: string) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    
    if (profilePictureUrl) {
        return L.divIcon({
            className: 'artist-marker',
            html: `
                <div style="
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: 3px solid black;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <img src="${profilePictureUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 10px solid black;
                "></div>
            `,
            iconSize: [44, 54],
            iconAnchor: [22, 54],
            popupAnchor: [0, -54]
        });
    } else {
        return L.divIcon({
            className: 'artist-marker',
            html: `
                <div style="
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: 3px solid black;
                    background: linear-gradient(135deg, #CCFF00, #FF69B4);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                ">🎨</div>
                <div style="
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 10px solid black;
                "></div>
            `,
            iconSize: [44, 54],
            iconAnchor: [22, 54],
            popupAnchor: [0, -54]
        });
    }
};

// Create custom icon for events
const createEventIcon = () => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    
    return L.divIcon({
        className: 'event-marker',
        html: `
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 3px solid black;
                background: #CCFF00;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            ">⭐</div>
            <div style="
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid black;
            "></div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
    });
};

// Address autocomplete suggestions interface
interface AddressSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
    };
}

export default function LocalPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    
    // Core state
    const [artists, setArtists] = useState<LocalArtistData[]>([]);
    const [events, setEvents] = useState<LocalEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtist, setSelectedArtist] = useState<LocalArtistData | null>(null);
    const [mapReady, setMapReady] = useState(false);
    
    // Content view toggle (Artists vs Events in the sidebar)
    const [contentView, setContentView] = useState<ContentView>('artists');
    
    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [distanceFilter, setDistanceFilter] = useState(10000);
    const [mediumFilter, setMediumFilter] = useState<MediumFilter[]>(['all']);
    const [showCommissions, setShowCommissions] = useState(false);
    const [showOpenStudio, setShowOpenStudio] = useState(false);
    const [showCollabs, setShowCollabs] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('nearest');
    const [searchQuery, setSearchQuery] = useState('');
    
    // User location
    const [userLocation, setUserLocation] = useState({ 
        lat: 53.0793, 
        lng: 8.8017, 
        city: 'Bremen' 
    });
    const [locationError, setLocationError] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([53.0793, 8.8017]);
    const [mapZoom, setMapZoom] = useState(4);
    const [gotUserLocation, setGotUserLocation] = useState(false);
    
    // Address input state
    const [showAddressInput, setShowAddressInput] = useState(false);
    const [addressMode, setAddressMode] = useState<'myLocation' | 'searchPlace'>('myLocation');
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const addressDebounceRef = useRef<NodeJS.Timeout | null>(null);
    
    // Registration state
    const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
    
    // Artist visibility state
    const [showVisibilityBanner, setShowVisibilityBanner] = useState(false);
    const [isVisibleOnMap, setIsVisibleOnMap] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    
    // Event creation state
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CreateEventData>>({
        title: '',
        description: '',
        category: 'exhibition',
        freeEntry: true,
        price: 0,
        startTime: '18:00',
        endTime: '22:00',
    });
    
    // Event address autocomplete state
    const [eventAddressQuery, setEventAddressQuery] = useState('');
    const [eventAddressSuggestions, setEventAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [loadingEventAddress, setLoadingEventAddress] = useState(false);
    const eventAddressDebounceRef = useRef<NodeJS.Timeout | null>(null);
    
    
    // Custom icons (created after map is ready)
    const [artistIcons, setArtistIcons] = useState<Record<string, any>>({});
    const [eventIcon, setEventIcon] = useState<any>(null);
    
    // Fix Leaflet default marker icon issue and create custom icons
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });
            setMapReady(true);
            setEventIcon(createEventIcon());
        }
    }, []);
    
    // Create artist icons when artists change
    useEffect(() => {
        if (!mapReady) return;
        const icons: Record<string, any> = {};
        artists.forEach(artist => {
            icons[artist.uid] = createArtistIcon(artist.profilePictureUrl);
        });
        setArtistIcons(icons);
    }, [artists, mapReady]);
    
    // Get user's location
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLat = position.coords.latitude;
                    const newLng = position.coords.longitude;
                    setUserLocation({
                        lat: newLat,
                        lng: newLng,
                        city: 'Your Location'
                    });
                    setMapCenter([newLat, newLng]);
                    setMapZoom(12);
                    setGotUserLocation(true);
                },
                (error) => {
                    console.log('Location error:', error);
                    setLocationError('Could not determine location. Showing world view.');
                }
            );
        }
    }, []);
    
    // Fetch data from Firebase
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [artistsData, eventsData] = await Promise.all([
                    getLocalArtists(100),
                    getUpcomingEvents(20)
                ]);
                setArtists(artistsData);
                setEvents(eventsData);
            } catch (error) {
                console.error("Error fetching local data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    // Check if current user is artist and their map visibility
    useEffect(() => {
        const checkArtistStatus = async () => {
            if (!user || !profile) return;
            
            if (profile.verificationStatus === 'verified') {
                try {
                    const artistProfile = await getArtistProfile(user.uid);
                    const hasLocation = artistProfile?.studioLocation?.latitude;
                    const visibility = artistProfile?.studioLocation?.showOnMap ?? false;
                    
                    setIsVisibleOnMap(visibility);
                    
                    if (!hasLocation) {
                        setShowVisibilityBanner(true);
                    }
                } catch (error) {
                    console.error("Error checking artist status:", error);
                }
            }
        };
        checkArtistStatus();
    }, [user, profile]);
    
    // Address autocomplete search
    const searchAddress = async (query: string) => {
        if (!query || query.length < 3) {
            setAddressSuggestions([]);
            return;
        }
        
        setLoadingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
                { headers: { 'Accept-Language': 'de' } }
            );
            const data = await response.json();
            setAddressSuggestions(data);
        } catch (error) {
            console.error("Error searching address:", error);
        } finally {
            setLoadingAddress(false);
        }
    };
    
    // Event address autocomplete search
    const searchEventAddress = async (query: string) => {
        if (!query || query.length < 3) {
            setEventAddressSuggestions([]);
            return;
        }
        
        setLoadingEventAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
                { headers: { 'Accept-Language': 'de' } }
            );
            const data = await response.json();
            setEventAddressSuggestions(data);
        } catch (error) {
            console.error("Error searching event address:", error);
        } finally {
            setLoadingEventAddress(false);
        }
    };
    
    // Select event address from suggestions
    const selectEventAddress = (suggestion: AddressSuggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        
        setNewEvent({
            ...newEvent,
            locationAddress: suggestion.display_name,
            latitude: lat,
            longitude: lng,
        } as any);
        
        setEventAddressQuery(suggestion.display_name);
        setEventAddressSuggestions([]);
    };
    
    // Debounced address search
    useEffect(() => {
        if (addressDebounceRef.current) {
            clearTimeout(addressDebounceRef.current);
        }
        addressDebounceRef.current = setTimeout(() => {
            searchAddress(addressQuery);
        }, 300);
        
        return () => {
            if (addressDebounceRef.current) {
                clearTimeout(addressDebounceRef.current);
            }
        };
    }, [addressQuery]);
    
    // Debounced event address search
    useEffect(() => {
        if (eventAddressDebounceRef.current) {
            clearTimeout(eventAddressDebounceRef.current);
        }
        eventAddressDebounceRef.current = setTimeout(() => {
            searchEventAddress(eventAddressQuery);
        }, 300);
        
        return () => {
            if (eventAddressDebounceRef.current) {
                clearTimeout(eventAddressDebounceRef.current);
            }
        };
    }, [eventAddressQuery]);
    
    // Select address from suggestions
    const selectAddress = async (suggestion: AddressSuggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || 'Unknown';
        const country = suggestion.address?.country || 'Germany';
        
        if (addressMode === 'myLocation') {
            // Set own location (for distance calculation)
            setUserLocation({ lat, lng, city });
            setMapCenter([lat, lng]);
            setMapZoom(12);
            setGotUserLocation(true);
            
            // IMPORTANT: If verified artist, also update artist profile!
            if (user && profile?.verificationStatus === 'verified') {
                try {
                    await updateArtistLocation(user.uid, lat, lng, city, country);
                    await updateArtistMapVisibility(user.uid, true);
                    setIsVisibleOnMap(true);
                    
                    // Update artist in the list (for immediate display)
                    setArtists(prev => prev.map(artist => 
                        artist.uid === user.uid 
                            ? { 
                                ...artist, 
                                location: { 
                                    latitude: lat, 
                                    longitude: lng, 
                                    city, 
                                    country 
                                } 
                            } 
                            : artist
                    ));
                } catch (error) {
                    console.error("Error updating artist location:", error);
                }
            }
        } else {
            // Only move map (own location remains unchanged)
            setMapCenter([lat, lng]);
            setMapZoom(12);
        }
        
        setAddressQuery('');
        setAddressSuggestions([]);
        setShowAddressInput(false);
    };
    
    // Calculate distances and filter artists
    const filteredArtists = useMemo(() => {
        return artists
            .filter(artist => artist.location)
            .map(artist => ({
                ...artist,
                distance: artist.location ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    artist.location.latitude,
                    artist.location.longitude
                ) : 99999
            }))
            .filter(artist => {
                if (artist.distance > distanceFilter) return false;
                if (!mediumFilter.includes('all') && artist.medium && !mediumFilter.includes(artist.medium)) return false;
                if (showCommissions && !artist.openForCommissions) return false;
                if (showOpenStudio && !artist.openStudio) return false;
                if (showCollabs && !artist.openForCollabs) return false;
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesName = artist.displayName.toLowerCase().includes(query);
                    const matchesArtStyle = artist.artStyle?.toLowerCase().includes(query);
                    const matchesCity = artist.location?.city.toLowerCase().includes(query);
                    if (!matchesName && !matchesArtStyle && !matchesCity) return false;
                }
                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'nearest': return (a.distance || 0) - (b.distance || 0);
                    case 'followers': return (b.followersCount || 0) - (a.followersCount || 0);
                    case 'alphabetical': return a.displayName.localeCompare(b.displayName);
                    default: return 0;
                }
            });
    }, [artists, userLocation, distanceFilter, mediumFilter, showCommissions, showOpenStudio, showCollabs, sortBy, searchQuery]);
    
    // Format date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    };
    
    // Format distance
    const formatDistance = (km: number) => {
        if (km < 1) return `${Math.round(km * 1000)} m`;
        if (km < 10) return `${km.toFixed(1)} km`;
        return `${Math.round(km)} km`;
    };
    
    // Clear filters
    const clearFilters = () => {
        setDistanceFilter(10000);
        setMediumFilter(['all']);
        setShowCommissions(false);
        setShowOpenStudio(false);
        setShowCollabs(false);
        setSortBy('nearest');
        setSearchQuery('');
    };
    
    // Toggle medium filter
    const toggleMedium = (medium: MediumFilter) => {
        if (medium === 'all') {
            setMediumFilter(['all']);
        } else {
            const newFilters = mediumFilter.filter(m => m !== 'all');
            if (newFilters.includes(medium)) {
                const updated = newFilters.filter(m => m !== medium);
                setMediumFilter(updated.length ? updated : ['all']);
            } else {
                setMediumFilter([...newFilters, medium]);
            }
        }
    };
    
    // Handle Registration
    const handleRegister = async (eventId: string) => {
        if (!user) {
            router.push("/auth/login");
            return;
        }
        
        try {
            if (registeredEvents.has(eventId)) {
                await unregisterFromEvent(eventId, user.uid);
                setRegisteredEvents(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(eventId);
                    return newSet;
                });
            } else {
                await registerForEvent(eventId, user.uid);
                setRegisteredEvents(prev => new Set([...prev, eventId]));
            }
        } catch (error) {
            console.error("Error handling registration:", error);
        }
    };
    
    // Seed demo locations
    const handleSeedLocations = async () => {
        if (confirm("This will add demo locations to all verified artists who don't have one yet. Continue?")) {
            try {
                const count = await seedDemoLocations();
                alert(`✅ Demo locations assigned to ${count} artists! Page will reload...`);
                window.location.reload();
            } catch (error) {
                console.error("Error seeding locations:", error);
                alert("Error assigning locations. See console.");
            }
        }
    };
    
    // Navigate to artist profile
    const goToProfile = (artistUid: string) => {
        router.push(`/profile/${artistUid}`);
    };
    
    // Center map on artist
    const focusArtistOnMap = (artist: LocalArtistData) => {
        if (artist.location) {
            setMapCenter([artist.location.latitude, artist.location.longitude]);
            setMapZoom(14);
            setSelectedArtist(artist);
        }
    };
    
    // Center map on event
    const focusEventOnMap = (event: LocalEvent) => {
        setMapCenter([event.location.latitude, event.location.longitude]);
        setMapZoom(14);
    };
    
    // Toggle map visibility for artist
    const toggleMapVisibility = async () => {
        if (!user) return;
        try {
            const newVisibility = !isVisibleOnMap;
            await updateArtistMapVisibility(user.uid, newVisibility);
            setIsVisibleOnMap(newVisibility);
        } catch (error) {
            console.error("Error toggling visibility:", error);
        }
    };
    
    // Update artist location
    const handleUpdateLocation = async () => {
        if (!user || !profile?.verificationStatus) return;
        
        if (profile.verificationStatus !== 'verified') {
            alert('You must be verified as an artist first!');
            return;
        }
        
        setUpdatingLocation(true);
        
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        await updateArtistLocation(
                            user.uid,
                            position.coords.latitude,
                            position.coords.longitude,
                            userLocation.city,
                            'Germany'
                        );
                        
                        await updateArtistMapVisibility(user.uid, true);
                        setIsVisibleOnMap(true);
                        setShowVisibilityBanner(false);
                        
                        alert('✅ Your location has been updated! You are now visible on the map.');
                        window.location.reload();
                    } catch (error) {
                        console.error("Error updating location:", error);
                        alert('Error updating location.');
                    } finally {
                        setUpdatingLocation(false);
                    }
                },
                (error) => {
                    console.error("Location error:", error);
                    alert('Could not determine location. Please allow location access.');
                    setUpdatingLocation(false);
                }
            );
        }
    };
    
    // Handle event creation
    const handleCreateEvent = async () => {
        if (!user || !profile || profile.verificationStatus !== 'verified') {
            alert('Only verified artists can create events.');
            return;
        }
        
        if (!newEvent.title || !newEvent.description || !newEvent.date) {
            alert('Please fill in all required fields.');
            return;
        }
        
        setCreatingEvent(true);
        
        try {
            // Use coordinates from selected address, or fallback to userLocation
            const eventLat = (newEvent as any).latitude || userLocation.lat;
            const eventLng = (newEvent as any).longitude || userLocation.lng;
            
            const eventData: CreateEventData = {
                title: newEvent.title!,
                description: newEvent.description!,
                category: newEvent.category as EventCategory || 'exhibition',
                date: newEvent.date!,
                startTime: newEvent.startTime || '18:00',
                endTime: newEvent.endTime || '22:00',
                location: {
                    name: (newEvent as any).locationName || 'Event Venue',
                    address: (newEvent as any).locationAddress || '',
                    city: userLocation.city || 'Unknown',
                    country: 'Germany',
                    latitude: eventLat,
                    longitude: eventLng
                },
                freeEntry: newEvent.freeEntry ?? true,
                price: newEvent.freeEntry ? undefined : newEvent.price,
                maxAttendees: newEvent.maxAttendees
            };
            
            const eventId = await createEvent(user.uid, profile.displayName || 'Artist', eventData);
            
            setShowCreateEventModal(false);
            setNewEvent({
                title: '',
                description: '',
                category: 'exhibition',
                freeEntry: true,
                price: 0,
                startTime: '18:00',
                endTime: '22:00',
            });
            setEventAddressQuery('');
            setEventAddressSuggestions([]);
            
            // Navigate to the created event page
            router.push(`/local/event/${eventId}`);
        } catch (error: any) {
            console.error("Error creating event:", error);
            alert(error.message || 'Error creating event.');
        } finally {
            setCreatingEvent(false);
        }
    };
    
    // Locate me - GPS
    const handleLocateMe = async () => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const newLat = position.coords.latitude;
                    const newLng = position.coords.longitude;
                    
                    setUserLocation({
                        lat: newLat,
                        lng: newLng,
                        city: 'Your Location'
                    });
                    setMapCenter([newLat, newLng]);
                    setMapZoom(12);
                    setGotUserLocation(true);
                    
                    // IMPORTANT: If verified artist, also update artist profile!
                    if (user && profile?.verificationStatus === 'verified') {
                        try {
                            await updateArtistLocation(user.uid, newLat, newLng, 'Your Location', 'Germany');
                            await updateArtistMapVisibility(user.uid, true);
                            setIsVisibleOnMap(true);
                            setShowVisibilityBanner(false);
                            
                            // Update artist in the list (for immediate display)
                            setArtists(prev => {
                                // Check if artist is already in the list
                                const existingIndex = prev.findIndex(a => a.uid === user.uid);
                                if (existingIndex >= 0) {
                                    // Update
                                    return prev.map(artist => 
                                        artist.uid === user.uid 
                                            ? { 
                                                ...artist, 
                                                location: { 
                                                    latitude: newLat, 
                                                    longitude: newLng, 
                                                    city: 'Your Location', 
                                                    country: 'Germany' 
                                                } 
                                            } 
                                            : artist
                                    );
                                } else {
                                    // Add as new artist
                                    return [...prev, {
                                        uid: user.uid,
                                        displayName: profile.displayName || 'Artist',
                                        profilePictureUrl: profile.profilePictureUrl,
                                        verificationStatus: 'verified',
                                        location: {
                                            latitude: newLat,
                                            longitude: newLng,
                                            city: 'Your Location',
                                            country: 'Germany'
                                        },
                                        followersCount: profile.followersCount || 0,
                                        artworksCount: 0
                                    }];
                                }
                            });
                        } catch (error) {
                            console.error("Error updating artist location:", error);
                        }
                    }
                },
                (error) => {
                    alert('Could not determine location. Please allow location access.');
                }
            );
        }
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            {/* Hero Header */}
            <div className="bg-accent border-b-4 border-black">
                <div className="container mx-auto max-w-7xl px-4 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white border-4 border-black shadow-comic flex items-center justify-center text-3xl">
                                📍
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading tracking-tight">
                                    LOCAL RADAR
                                </h1>
                                <p className="text-gray-700 text-sm md:text-base font-body">
                                    {gotUserLocation ? (
                                        <span className="font-bold">📍 {userLocation.city}</span>
                                    ) : (
                                        <span>{userLocation.city}</span>
                                    )}
{' • '}<span className="font-bold">{filteredArtists.length}</span> Artists
                                                    {' • '}<span className="font-bold">{events.length}</span> Events
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {/* My Location (GPS) */}
                            <button
                                onClick={handleLocateMe}
                                className={`flex items-center gap-2 px-4 py-2.5 border-3 border-black font-heading text-sm transition-all shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] ${
                                    gotUserLocation 
                                        ? 'bg-black text-white' 
                                        : 'bg-white hover:bg-gray-100'
                                }`}
                                title={profile?.verificationStatus === 'verified' 
                                    ? "Get my location via GPS (also updates your artist profile on the map)" 
                                    : "Get my location via GPS"
                                }
                            >
                                📍 {gotUserLocation ? '✓ LOCATION' : 'MY LOCATION'}
                            </button>
                            
                            {/* Search Place on Map */}
                            <button
                                onClick={() => {
                                    setAddressMode('searchPlace');
                                    setShowAddressInput(!showAddressInput);
                                }}
                                className={`flex items-center gap-2 px-4 py-2.5 border-3 border-black font-heading text-sm transition-all shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] ${
                                    showAddressInput && addressMode === 'searchPlace'
                                        ? 'bg-black text-white' 
                                        : 'bg-white hover:bg-gray-100'
                                }`}
                                title="Search location on map"
                            >
                                🔍 SEARCH LOCATION
                            </button>
                            
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2.5 border-3 border-black font-heading text-sm transition-all shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] ${
                                    showFilters 
                                        ? 'bg-black text-white' 
                                        : 'bg-white hover:bg-gray-100'
                                }`}
                            >
                                ⚡ FILTER
                            </button>
                            
                            {profile?.verificationStatus === 'verified' && (
                                <button
                                    onClick={() => setShowCreateEventModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 border-3 border-black font-heading text-sm bg-white hover:bg-gray-100 transition-all shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]"
                                >
                                    + EVENT
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Address Input with Autocomplete */}
                    {showAddressInput && (
                        <div className="mt-4 relative z-[3000]">
                            {/* Mode Toggle */}
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setAddressMode('searchPlace')}
                                    className={`px-3 py-1.5 border-2 border-black font-heading text-xs transition-all ${
                                        addressMode === 'searchPlace' ? 'bg-accent' : 'bg-white'
                                    }`}
                                >
                                    🔍 Show location on map
                                </button>
                                <button
                                    onClick={() => setAddressMode('myLocation')}
                                    className={`px-3 py-1.5 border-2 border-black font-heading text-xs transition-all ${
                                        addressMode === 'myLocation' ? 'bg-accent' : 'bg-white'
                                    }`}
                                >
                                    📍 Set as my location
                                </button>
                            </div>
                            
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder={addressMode === 'myLocation' 
                                        ? "Enter my address (e.g. 123 Main St, New York)..." 
                                        : "Search location (e.g. Paris, Eiffel Tower)..."
                                    }
                                    className="flex-1 px-4 py-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-black"
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        setShowAddressInput(false);
                                        setAddressQuery('');
                                        setAddressSuggestions([]);
                                    }}
                                    className="px-4 py-2 border-3 border-black bg-white hover:bg-gray-100 font-heading"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {/* Info Text */}
                            <p className="text-xs text-gray-600 mt-1 font-body">
                                {addressMode === 'myLocation' 
                                    ? (profile?.verificationStatus === 'verified'
                                        ? '📍 This location will be saved as your location AND update your artist profile on the map!'
                                        : '📍 This location will be saved as your location (for distance calculation)')
                                    : '🔍 The map will move to this location (your location remains unchanged)'
                                }
                            </p>
                            
                            {/* Suggestions Dropdown */}
                            {addressSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-3 border-black shadow-comic z-[2000] max-h-60 overflow-y-auto">
                                    {addressSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => selectAddress(suggestion)}
                                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-black/10 last:border-b-0"
                                        >
                                            <p className="font-bold text-sm truncate">{suggestion.display_name.split(',')[0]}</p>
                                            <p className="text-xs text-gray-500 truncate">{suggestion.display_name}</p>
                                            <p className="text-[10px] text-accent font-heading mt-1">
                                                {addressMode === 'myLocation' ? '→ Set as my location' : '→ Show on map'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {loadingAddress && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-3 border-black p-4 text-center z-[2000]">
                                    <span className="animate-pulse">🔍 Searching...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Artist Visibility Banner */}
            {user && profile?.verificationStatus === 'verified' && showVisibilityBanner && (
                <div className="bg-white border-b-4 border-black">
                    <div className="container mx-auto max-w-7xl px-4 py-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎨</span>
                                <div>
<p className="font-heading text-sm">SHOW YOURSELF ON THE MAP!</p>
                                                    <p className="text-xs text-gray-600 font-body">As a verified artist you can share your location.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="secondary" 
                                    className="text-sm"
                                    onClick={() => setShowVisibilityBanner(false)}
                                >
                                    Later
                                </Button>
                                <Button 
                                    variant="accent" 
                                    className="text-sm"
                                    onClick={handleUpdateLocation}
                                    disabled={updatingLocation}
                                >
                                    {updatingLocation ? '📍 Loading...' : '📍 SET LOCATION'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-gray-50 border-b-4 border-black">
                    <div className="container mx-auto max-w-7xl px-4 py-6">
                        {/* Search */}
                        <div className="mb-6">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="🔍 Search by name, city or style..."
                                className="w-full md:w-96 px-4 py-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        
                        <div className="grid md:grid-cols-4 gap-6">
                            {/* Distance Slider */}
                            <div>
                                <label className="font-heading text-sm block mb-3">DISTANCE</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10000"
                                        value={distanceFilter}
                                        onChange={(e) => setDistanceFilter(Number(e.target.value))}
                                        className="flex-1 accent-accent h-2"
                                    />
                                    <span className="font-heading text-sm w-20">
                                        {distanceFilter >= 10000 ? 'Global' : `${distanceFilter} km`}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Medium Filter */}
                            <div>
                                <label className="font-heading text-sm block mb-3">MEDIUM</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'digital', 'traditional', 'photography', 'illustration'] as MediumFilter[]).map((medium) => (
                                        <button
                                            key={medium}
                                            onClick={() => toggleMedium(medium)}
                                            className={`px-3 py-1.5 text-xs border-2 border-black transition-all ${
                                                mediumFilter.includes(medium) 
                                                    ? 'bg-accent' 
                                                    : 'bg-white hover:bg-gray-100'
                                            }`}
                                        >
                                            {medium === 'all' ? '✓ Alle' : PIN_TYPES[medium as ArtistMedium]?.emoji + ' ' + medium}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Availability Filters */}
                            <div>
                                <label className="font-heading text-sm block mb-3">AVAILABILITY</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'commissions', label: 'Commissions Open', state: showCommissions, setter: setShowCommissions },
                                        { key: 'studio', label: 'Open Studio', state: showOpenStudio, setter: setShowOpenStudio },
                                        { key: 'collabs', label: 'Collabs', state: showCollabs, setter: setShowCollabs },
                                    ].map((filter) => (
                                        <label key={filter.key} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={filter.state}
                                                onChange={(e) => filter.setter(e.target.checked)}
                                                className="w-4 h-4 accent-accent"
                                            />
                                            <span className="text-sm font-body group-hover:font-bold transition-all">{filter.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Sort By */}
                            <div>
                                <label className="font-heading text-sm block mb-3">SORT BY</label>
                                <div className="space-y-2">
                                    {[
{ value: 'nearest', label: 'Nearest first' },
                                                        { value: 'followers', label: 'Most followers' },
                                                        { value: 'alphabetical', label: 'Alphabetical' },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="sort"
                                                checked={sortBy === option.value}
                                                onChange={() => setSortBy(option.value as SortOption)}
                                                className="w-4 h-4 accent-accent"
                                            />
                                            <span className="text-sm font-body group-hover:font-bold transition-all">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 mt-6 pt-4 border-t-2 border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-heading text-sm transition-all"
                            >
                                CLEAR FILTERS
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="px-4 py-2 border-2 border-black bg-accent hover:bg-accent/80 font-heading text-sm transition-all"
                            >
                                APPLY ✓
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Content - Split View */}
            <div className="container mx-auto max-w-7xl px-4 py-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
                        <p className="font-heading text-xl">Loading artists & events...</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* Left Side - Map */}
                        <div className="lg:w-[60%]">
                            <div className="relative border-4 border-black shadow-comic overflow-hidden h-[50vh] lg:h-[calc(100vh-220px)] lg:sticky lg:top-24">
                                {/* Map Legend */}
                                <div className="absolute bottom-4 left-4 z-[1000] bg-white border-3 border-black p-3 shadow-comic">
                                    <p className="font-heading text-xs mb-2">LEGEND</p>
                                    <div className="flex flex-col gap-1.5 text-xs font-body">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full border-2 border-black bg-gradient-to-br from-accent to-pink-400"></div>
                                            <span>Artists ({filteredArtists.length})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded border-2 border-black bg-accent flex items-center justify-center text-xs">⭐</div>
                                            <span>Events ({events.length})</span>
                                        </div>
                                        {gotUserLocation && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-accent border-2 border-black"></div>
                                                <span className="text-accent font-bold">You are here</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Actual Map */}
                                {mapReady && typeof window !== 'undefined' && (
                                    <MapContainer
                                        key={`map-${gotUserLocation}-${mapCenter.join(',')}`}
                                        center={mapCenter}
                                        zoom={mapZoom}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        
                                        {/* User Location */}
                                        {gotUserLocation && (
                                            <CircleMarker
                                                center={[userLocation.lat, userLocation.lng]}
                                                radius={12}
                                                pathOptions={{
                                                    color: '#000',
                                                    fillColor: '#CCFF00',
                                                    fillOpacity: 0.9,
                                                    weight: 3
                                                }}
                                            >
                                                <Popup>
                                                    <div className="text-center p-2 font-bold">
                                                        📍 You are here!<br/>
                                                        <span className="font-normal text-sm">{userLocation.city}</span>
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        )}
                                        
                                        {/* Artist Markers with Profile Pictures */}
                                        {filteredArtists.map((artist) => artist.location && artistIcons[artist.uid] && (
                                            <Marker
                                                key={artist.uid}
                                                position={[artist.location.latitude, artist.location.longitude]}
                                                icon={artistIcons[artist.uid]}
                                                eventHandlers={{
                                                    click: () => setSelectedArtist(artist)
                                                }}
                                            >
                                                <Popup>
                                                    <div className="text-center p-2">
                                                        <p className="font-bold">@{artist.displayName}</p>
                                                        <p className="text-sm text-gray-500">{artist.artStyle || 'Artist'}</p>
                                                        <p className="text-xs">{artist.location.city}</p>
                                                        <button 
                                                            onClick={() => goToProfile(artist.uid)}
                                                            className="mt-2 px-3 py-1 bg-accent border-2 border-black text-xs font-bold"
                                                        >
                                                            PROFIL →
                                                        </button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                        
                                        {/* Event Markers with Star Icon */}
                                        {events.map((event) => eventIcon && (
                                            <Marker
                                                key={event.id}
                                                position={[event.location.latitude, event.location.longitude]}
                                                icon={eventIcon}
                                            >
                                                <Popup>
                                                    <div className="text-center p-2">
                                                        <p className="font-bold">⭐ {event.title}</p>
                                                        <p className="text-sm">{formatDate(event.date)}</p>
                                                        <p className="text-xs text-gray-500">{event.location.city}</p>
                                                        <Link href={`/local/event/${event.id}`}>
                                                            <button className="mt-2 px-3 py-1 bg-accent border-2 border-black text-xs font-bold">
                                                                DETAILS →
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                )}
                                
                                {!mapReady && (
                                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                                            <p className="text-gray-600 font-heading text-sm">Loading map...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Right Side - Content Panel */}
                        <div className="lg:w-[40%]">
                            {/* Toggle between Artists and Events */}
                            <div className="flex border-4 border-black mb-4 shadow-comic">
                                <button
                                    onClick={() => setContentView('artists')}
                                    className={`flex-1 py-3 font-heading text-sm transition-all ${
                                        contentView === 'artists' 
                                            ? 'bg-accent' 
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                >
                                    🎨 ARTISTS ({filteredArtists.length})
                                </button>
                                <button
                                    onClick={() => setContentView('events')}
                                    className={`flex-1 py-3 font-heading text-sm transition-all border-l-4 border-black ${
                                        contentView === 'events' 
                                            ? 'bg-accent' 
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                >
                                    ⭐ EVENTS ({events.length})
                                </button>
                            </div>
                            
                            {/* Scrollable Content */}
                            <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
                                
                                {/* ARTISTS VIEW */}
                                {contentView === 'artists' && (
                                    <>
                                        {filteredArtists.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 border-4 border-black">
                                                <span className="text-5xl mb-4 block">🔍</span>
                                                <h3 className="font-heading text-lg mb-2">No artists found</h3>
                                                <p className="text-gray-600 text-sm mb-4 font-body">Adjust filters or add demo locations</p>
                                                <Button 
                                                    variant="accent"
                                                    onClick={handleSeedLocations}
                                                >
                                                    🌱 Demo Locations
                                                </Button>
                                            </div>
                                        ) : (
                                            filteredArtists.map((artist) => (
                                                <div 
                                                    key={artist.uid}
                                                    className="group bg-white border-4 border-black p-4 transition-all cursor-pointer shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]"
                                                    onClick={() => focusArtistOnMap(artist)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 bg-gray-100 border-3 border-black rounded-full overflow-hidden flex-shrink-0">
                                                            {artist.profilePictureUrl ? (
                                                                <img src={artist.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="flex items-center justify-center h-full text-xl">
                                                                    {artist.medium ? PIN_TYPES[artist.medium]?.emoji : '🎨'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-bold">@{artist.displayName}</p>
                                                                <span className="px-1.5 py-0.5 text-[10px] bg-green-200 border border-black font-heading">✓</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 truncate font-body">{artist.artStyle || 'Artist'}</p>
                                                            {artist.location && (
                                                                <p className="text-xs text-gray-500 mt-1 font-body">
                                                                    📍 {formatDistance(artist.distance || 0)} • {artist.location.city}
                                                                </p>
                                                            )}
                                                            
                                                            {/* Tags */}
                                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                                {artist.openForCommissions && (
                                                                    <span className="px-2 py-0.5 text-[10px] bg-accent border border-black font-heading">COMMISSIONS</span>
                                                                )}
                                                                {artist.openStudio && (
                                                                    <span className="px-2 py-0.5 text-[10px] bg-white border border-black font-heading">OPEN STUDIO</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1.5">
                                                            <Link 
                                                                href={`/profile/${artist.uid}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="px-3 py-1.5 bg-accent border-2 border-black text-xs font-heading hover:bg-accent/80 transition-all text-center"
                                                            >
                                                                PROFIL
                                                            </Link>
                                                            <button 
                                                                className="px-3 py-1.5 bg-white border-2 border-black text-xs font-heading hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    focusArtistOnMap(artist);
                                                                }}
                                                            >
                                                                🗺️ MAP
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                                
                                {/* EVENTS VIEW */}
                                {contentView === 'events' && (
                                    <>
                                        {events.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 border-4 border-black">
                                                <span className="text-5xl mb-4 block">📅</span>
                                                <h3 className="font-heading text-lg mb-2">No Events</h3>
                                                <p className="text-gray-600 text-sm font-body">Events will be available soon!</p>
                                                {profile?.verificationStatus === 'verified' && (
                                                    <Button 
                                                        variant="accent"
                                                        onClick={() => setShowCreateEventModal(true)}
                                                        className="mt-4"
                                                    >
                                                        + Create first event
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            events.map((event) => (
                                                <div 
                                                    key={event.id}
                                                    className="group bg-white border-4 border-black overflow-hidden transition-all cursor-pointer shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]"
                                                    onClick={() => focusEventOnMap(event)}
                                                >
                                                    {/* Event Header */}
                                                    <div className="h-20 bg-gradient-to-r from-accent to-accent-pink relative">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-4xl opacity-30">⭐</span>
                                                        </div>
                                                        {event.featured && (
                                                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 border-2 border-black text-[10px] font-heading">
                                                                ⭐ FEATURED
                                                            </span>
                                                        )}
                                                        <div className="absolute bottom-2 left-3">
                                                            <span className={`px-2 py-0.5 border-2 border-black text-[10px] font-heading ${
                                                                event.freeEntry 
                                                                    ? 'bg-accent' 
                                                                    : 'bg-white'
                                                            }`}>
                                                                {event.freeEntry ? '🎫 FREE' : `🎫 ${event.price}€`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-4">
                                                        <h3 className="font-heading mb-1 line-clamp-1">{event.title}</h3>
                                                        <div className="text-xs text-gray-600 space-y-0.5 font-body">
                                                            <p>📅 {formatDate(event.date)} • {event.startTime}</p>
                                                            <p>📍 {event.location.name}, {event.location.city}</p>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between mt-3">
                                                            <span className="text-xs text-gray-500 font-body">
                                                                👥 {event.attendeesCount} Attendees
                                                            </span>
                                                            <Link
                                                                href={`/local/event/${event.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="px-3 py-1.5 border-2 border-black bg-accent hover:bg-accent/80 text-xs font-heading transition-all"
                                                            >
                                                                REGISTER →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Artist Detail Modal */}
            {selectedArtist && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedArtist(null)}
                >
                    <div 
                        className="bg-white border-4 border-black shadow-comic max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-heading text-xl">ARTIST PROFILE</h2>
                                <button 
                                    onClick={() => setSelectedArtist(null)}
                                    className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-accent transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 bg-gray-100 border-4 border-black rounded-full overflow-hidden">
                                    {selectedArtist.profilePictureUrl ? (
                                        <img src={selectedArtist.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="flex items-center justify-center h-full text-3xl">
                                            {selectedArtist.medium ? PIN_TYPES[selectedArtist.medium]?.emoji : '🎨'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-xl">{selectedArtist.displayName}</p>
                                    {selectedArtist.location && (
                                        <p className="text-sm text-gray-600 font-body">
                                            📍 {selectedArtist.location.city}, {selectedArtist.location.country}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 p-3 bg-gray-50 border-2 border-black text-center">
                                    <p className="font-heading text-lg">{selectedArtist.followersCount || 0}</p>
                                    <p className="text-xs text-gray-500 font-body">Followers</p>
                                </div>
                                <div className="flex-1 p-3 bg-gray-50 border-2 border-black text-center">
                                    <p className="font-heading text-lg">{selectedArtist.artworksCount || 0}</p>
                                    <p className="text-xs text-gray-500 font-body">Artworks</p>
                                </div>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1.5 text-sm bg-green-200 border-2 border-black font-heading">
                                    ✓ VERIFIED
                                </span>
                                {selectedArtist.medium && (
                                    <span 
                                        className="px-3 py-1.5 text-sm border-2 border-black font-heading"
                                        style={{ backgroundColor: PIN_TYPES[selectedArtist.medium]?.color || '#ccc' }}
                                    >
                                        {PIN_TYPES[selectedArtist.medium]?.emoji} {PIN_TYPES[selectedArtist.medium]?.label}
                                    </span>
                                )}
                                {selectedArtist.openForCommissions && (
                                    <span className="px-3 py-1.5 text-sm bg-accent border-2 border-black font-heading">
                                        💼 COMMISSIONS
                                    </span>
                                )}
                            </div>
                            
                            {/* Art Style */}
                            {selectedArtist.artStyle && (
                                <div className="mb-6 p-4 bg-accent/20 border-2 border-black">
                                    <h3 className="font-heading text-sm mb-1">ART STYLE</h3>
                                    <p className="font-body">{selectedArtist.artStyle}</p>
                                </div>
                            )}
                            
                            {/* Bio */}
                            <div className="mb-6">
                                <h3 className="font-heading text-sm mb-2">ABOUT</h3>
                                <p className="text-gray-600 font-body">{selectedArtist.bio || 'Verified artist on VARBE'}</p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button variant="secondary" className="flex-1">
                                    💬 MESSAGE
                                </Button>
                                <Link href={`/profile/${selectedArtist.uid}`} className="flex-1">
                                    <Button variant="accent" className="w-full">
                                        VIEW PROFILE →
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Create Event Modal */}
            {showCreateEventModal && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCreateEventModal(false)}
                >
                    <div 
                        className="bg-white border-4 border-black shadow-comic max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-heading text-xl">NEW EVENT</h2>
                                <button 
                                    onClick={() => setShowCreateEventModal(false)}
                                    className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-accent transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="font-heading text-sm block mb-2">TITLE *</label>
                                    <input
                                        type="text"
                                        value={newEvent.title || ''}
                                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                        className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                        placeholder="e.g. Open Studio Weekend"
                                    />
                                </div>
                                
                                {/* Category */}
                                <div>
                                    <label className="font-heading text-sm block mb-2">CATEGORY *</label>
                                    <select
                                        value={newEvent.category || 'exhibition'}
                                        onChange={(e) => setNewEvent({...newEvent, category: e.target.value as EventCategory})}
                                        className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
<option value="exhibition">🖼️ Exhibition</option>
                                                        <option value="open_studio">🏠 Open Studio</option>
                                                        <option value="workshop">🎨 Workshop</option>
                                                        <option value="art_walk">🚶 Art Walk</option>
                                                        <option value="meetup">☕ Meetup</option>
                                                        <option value="market">🛒 Art Market</option>
                                    </select>
                                </div>
                                
                                {/* Description */}
                                <div>
                                    <label className="font-heading text-sm block mb-2">DESCRIPTION *</label>
                                    <textarea
                                        value={newEvent.description || ''}
                                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                        className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                                        placeholder="Describe your event..."
                                    />
                                </div>
                                
                                {/* Date */}
                                <div>
                                    <label className="font-heading text-sm block mb-2">DATE *</label>
                                    <input
                                        type="date"
                                        onChange={(e) => setNewEvent({...newEvent, date: new Date(e.target.value).getTime()})}
                                        className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                
                                {/* Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-heading text-sm block mb-2">START</label>
                                        <input
                                            type="time"
                                            value={newEvent.startTime || '18:00'}
                                            onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                                            className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-heading text-sm block mb-2">ENDE</label>
                                        <input
                                            type="time"
                                            value={newEvent.endTime || '22:00'}
                                            onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                                            className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                </div>
                                
                                {/* Location Name */}
                                <div>
                                    <label className="font-heading text-sm block mb-2">VENUE</label>
                                    <input
                                        type="text"
                                        value={(newEvent as any).locationName || ''}
                                        onChange={(e) => setNewEvent({...newEvent, locationName: e.target.value} as any)}
                                        className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                        placeholder="e.g. Art Studio NYC"
                                    />
                                </div>
                                
                                {/* Address with Autocomplete */}
                                <div className="relative">
                                    <label className="font-heading text-sm block mb-2">ADDRESS</label>
                                    <input
                                        type="text"
                                        value={eventAddressQuery || (newEvent as any).locationAddress || ''}
                                        onChange={(e) => {
                                            setEventAddressQuery(e.target.value);
                                            setNewEvent({...newEvent, locationAddress: e.target.value} as any);
                                        }}
                                        className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                        placeholder="e.g. 123 Art Street, New York"
                                    />
                                    
                                    {/* Suggestions Dropdown */}
                                    {eventAddressSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-3 border-black shadow-comic z-[100] max-h-48 overflow-y-auto">
                                            {eventAddressSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectEventAddress(suggestion)}
                                                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-black/10 last:border-b-0"
                                                >
                                                    <p className="font-bold text-sm truncate">{suggestion.display_name.split(',')[0]}</p>
                                                    <p className="text-xs text-gray-500 truncate">{suggestion.display_name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {loadingEventAddress && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-3 border-black p-3 text-center z-[100]">
                                            <span className="animate-pulse text-sm">🔍 Suche...</span>
                                        </div>
                                    )}
                                    
                                    {(newEvent as any).latitude && (newEvent as any).longitude && (
                                        <p className="text-xs text-green-600 mt-1">
                                            ✅ Coordinates captured - Event will be shown on map
                                        </p>
                                    )}
                                </div>
                                
                                {/* Free Entry Toggle */}
                                <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-black">
                                    <input
                                        type="checkbox"
                                        id="freeEntry"
                                        checked={newEvent.freeEntry ?? true}
                                        onChange={(e) => setNewEvent({...newEvent, freeEntry: e.target.checked})}
                                        className="w-5 h-5 accent-accent"
                                    />
                                    <label htmlFor="freeEntry" className="font-heading text-sm cursor-pointer">
                                        FREE ENTRY
                                    </label>
                                </div>
                                
                                {/* Price (if not free) */}
                                {!newEvent.freeEntry && (
                                    <div>
                                        <label className="font-heading text-sm block mb-2">PRICE (€)</label>
                                        <input
                                            type="number"
                                            value={newEvent.price || 0}
                                            onChange={(e) => setNewEvent({...newEvent, price: Number(e.target.value)})}
                                            className="w-full p-3 border-3 border-black font-body focus:outline-none focus:ring-2 focus:ring-accent"
                                            min="0"
                                        />
                                    </div>
                                )}
                                
                                {/* Submit */}
                                <div className="flex gap-3 pt-4">
                                    <Button 
                                        variant="secondary" 
                                        className="flex-1"
                                        onClick={() => {
                                            setShowCreateEventModal(false);
                                            setEventAddressQuery('');
                                            setEventAddressSuggestions([]);
                                        }}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button 
                                        variant="accent" 
                                        className="flex-1"
                                        onClick={handleCreateEvent}
                                        disabled={creatingEvent}
                                    >
                                        {creatingEvent ? 'CREATING...' : 'CREATE'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <Footer />
        </main>
    );
}

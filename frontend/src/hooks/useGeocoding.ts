import { useState, useEffect, useCallback } from 'react';

interface GeocodeResult {
    lat: number;
    lng: number;
    displayName: string;
}

interface UseGeocodingReturn {
    geocode: (address: string) => Promise<GeocodeResult | null>;
    reverseGeocode: (lat: number, lng: number) => Promise<string | null>;
    loading: boolean;
    error: string | null;
}

// Simple cache to avoid duplicate Nominatim requests
const geocodeCache = new Map<string, GeocodeResult | null>();

export const useGeocoding = (): UseGeocodingReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Geocode an address string or components to lat/lng
     * Uses Nominatim (OpenStreetMap) – free, no API key required
     */
    const geocode = useCallback(async (address: string): Promise<GeocodeResult | null> => {
        if (!address.trim()) return null;

        const cacheKey = address.trim().toLowerCase();
        if (geocodeCache.has(cacheKey)) {
            return geocodeCache.get(cacheKey) ?? null;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                q: address,
                format: 'json',
                limit: '1',
                countrycodes: 'vn', // Ưu tiên Việt Nam
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                {
                    headers: {
                        'Accept-Language': 'vi,en',
                        'User-Agent': 'RealEstateApp/1.0',
                    },
                }
            );

            if (!response.ok) throw new Error('Geocoding request failed');

            const data = await response.json();

            if (!data || data.length === 0) {
                geocodeCache.set(cacheKey, null);
                return null;
            }

            const result: GeocodeResult = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name,
            };

            geocodeCache.set(cacheKey, result);
            return result;
        } catch (err) {
            setError('Không thể lấy tọa độ từ địa chỉ');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Reverse geocode lat/lng to address string
     */
    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json',
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?${params}`,
                {
                    headers: {
                        'Accept-Language': 'vi,en',
                        'User-Agent': 'RealEstateApp/1.0',
                    },
                }
            );

            if (!response.ok) throw new Error('Reverse geocoding failed');

            const data = await response.json();
            return data?.display_name ?? null;
        } catch (err) {
            setError('Không thể lấy địa chỉ từ tọa độ');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { geocode, reverseGeocode, loading, error };
};

/**
 * Hook để tự động geocode địa chỉ của một BĐS
 */
export const usePropertyCoordinates = (
    latitude?: number,
    longitude?: number,
    address?: string,
    city?: string
) => {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );
    const [geocoding, setGeocoding] = useState(false);
    const { geocode } = useGeocoding();

    useEffect(() => {
        // Nếu đã có tọa độ thì dùng luôn
        if (latitude && longitude) {
            setCoords({ lat: latitude, lng: longitude });
            return;
        }

        // Nếu không có tọa độ nhưng có địa chỉ thì geocode
        if (address || city) {
            const fullAddress = [address, city, 'Việt Nam'].filter(Boolean).join(', ');
            setGeocoding(true);
            geocode(fullAddress)
                .then((result) => {
                    if (result) {
                        setCoords({ lat: result.lat, lng: result.lng });
                    }
                })
                .finally(() => setGeocoding(false));
        }
    }, [latitude, longitude, address, city]);

    return { coords, geocoding };
};

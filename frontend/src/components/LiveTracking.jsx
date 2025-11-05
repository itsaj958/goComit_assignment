import React, { useState, useEffect } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsService, DirectionsRenderer, InfoWindow } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = { lat: 20.5937, lng: 78.9629 } // India center fallback

const LiveTracking = ({ pickupCoords, destinationCoords, pickupLabel, destinationLabel }) => {
    const [ currentPosition, setCurrentPosition ] = useState(center);
    const [ directions, setDirections ] = useState(null);
    const [ travelInfo, setTravelInfo ] = useState({ distanceText: '', durationText: '' });
    const mapRef = React.useRef(null)
    const userInteractedRef = React.useRef(false)

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            });
        });

        const watchId = navigator.geolocation.watchPosition((position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({ lat: latitude, lng: longitude });
            if (mapRef.current && !userInteractedRef.current) {
                mapRef.current.panTo({ lat: latitude, lng: longitude })
            }
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Remove forced interval-based center/zoom updates; live pan handled by watchPosition above

    const origin = pickupCoords ? { lat: pickupCoords.ltd, lng: pickupCoords.lng } : null;
    const destination = destinationCoords ? { lat: destinationCoords.ltd, lng: destinationCoords.lng } : null;

    useEffect(() => {
        // Reset directions when inputs change
        if (!origin || !destination) {
            setDirections(null);
        }
    }, [ pickupCoords, destinationCoords ]);

    const onLoad = (map) => {
        mapRef.current = map
        map.addListener('dragstart', () => { userInteractedRef.current = true })
        map.addListener('zoom_changed', () => { userInteractedRef.current = true })
    }

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                onLoad={onLoad}
                mapContainerStyle={containerStyle}
                center={origin || currentPosition}
                zoom={origin && destination ? 12 : 14}
                options={{
                    gestureHandling: 'greedy',
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    clickableIcons: false
                }}
            >
                {/* Current device position */}
                <Marker position={currentPosition} />

                {/* Pickup and Destination markers */}
                {origin && <Marker position={origin} />}
                {destination && <Marker position={destination} />}

                {/* Compute directions when both points available */}
                {origin && destination && !directions && (
                    <DirectionsService
                        options={{
                            origin,
                            destination,
                            travelMode: window.google.maps.TravelMode.DRIVING,
                        }}
                        callback={(result, status) => {
                            if (status === window.google.maps.DirectionsStatus.OK) {
                                setDirections(result);
                                try {
                                    const leg = result.routes?.[0]?.legs?.[0];
                                    if (leg) {
                                        setTravelInfo({
                                            distanceText: leg.distance?.text || '',
                                            durationText: leg.duration?.text || ''
                                        });
                                    }
                                } catch {}
                            }
                        }}
                    />
                )}

                {/* Render route */}
                {directions && <DirectionsRenderer options={{ directions }} />}

                {/* Labels for pickup and drop */}
                {origin && (
                    <InfoWindow position={origin} options={{ pixelOffset: new window.google.maps.Size(0, -30) }}>
                        <div style={{ fontSize: 12 }}><b>Pickup:</b> {pickupLabel}</div>
                    </InfoWindow>
                )}
                {destination && (
                    <InfoWindow position={destination} options={{ pixelOffset: new window.google.maps.Size(0, -30) }}>
                        <div style={{ fontSize: 12 }}><b>Drop:</b> {destinationLabel}</div>
                    </InfoWindow>
                )}
            </GoogleMap>
            {/* Distance/Duration overlay */}
            {directions && (
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'white', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 13 }}>
                    <span><b>Time:</b> {travelInfo.durationText || '-'} </span>
                    <span style={{ marginLeft: 10 }}><b>Distance:</b> {travelInfo.distanceText || '-'}</span>
                </div>
            )}
        </LoadScript>
    )
}

export default LiveTracking
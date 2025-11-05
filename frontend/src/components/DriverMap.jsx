import React, { useContext, useEffect, useRef, useState } from 'react'
import { LoadScript, GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'

const containerStyle = {
    width: '100%',
    height: '100%'
}

const DriverMap = ({ onPositionChanged, routeOrigin, routeDestination }) => {
    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)
    const [ currentPosition, setCurrentPosition ] = useState(null)
    const mapRef = useRef(null)
    const [ directions, setDirections ] = useState(null)
    const userInteractedRef = useRef(false)
    const [ followGPS, setFollowGPS ] = useState(true)

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords
            setCurrentPosition({ lat: latitude, lng: longitude })
            if (mapRef.current) {
                mapRef.current.setCenter({ lat: latitude, lng: longitude })
            }
            onPositionChanged?.({ lat: latitude, lng: longitude })
        })

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const { latitude, longitude } = pos.coords
            if (followGPS) {
                setCurrentPosition({ lat: latitude, lng: longitude })
                onPositionChanged?.({ lat: latitude, lng: longitude })
                if (mapRef.current && !userInteractedRef.current) {
                    mapRef.current.panTo({ lat: latitude, lng: longitude })
                }
            }
        })

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [])

    const onLoad = (map) => {
        mapRef.current = map
        // Capture user interactions to stop auto-follow
        map.addListener('dragstart', () => { userInteractedRef.current = true })
        map.addListener('zoom_changed', () => { userInteractedRef.current = true })
    }

    // Clear directions when either point is missing
    useEffect(() => {
        if (!routeOrigin || !routeDestination) {
            setDirections(null)
        }
    }, [ routeOrigin, routeDestination ])

    const emitLocation = (lat, lng) => {
        try {
            socket.emit('update-location-captain', {
                userId: captain._id,
                location: { ltd: lat, lng: lng }
            })
        } catch {}
    }

    const handleMapClick = (e) => {
        if (!e?.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setCurrentPosition({ lat, lng })
        userInteractedRef.current = true
        setFollowGPS(false)
        onPositionChanged?.({ lat, lng })
        emitLocation(lat, lng)
    }

    const handleMarkerDragEnd = (e) => {
        if (!e?.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setCurrentPosition({ lat, lng })
        userInteractedRef.current = true
        setFollowGPS(false)
        onPositionChanged?.({ lat, lng })
        emitLocation(lat, lng)
    }

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                onLoad={onLoad}
                mapContainerStyle={containerStyle}
                center={currentPosition || routeOrigin || { lat: 20.5937, lng: 78.9629 }}
                // Do not force a zoom; let user control it. Provide a sensible default.
                zoom={currentPosition || (routeOrigin && routeDestination) ? 14 : 5}
                options={{
                    gestureHandling: 'greedy',
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    clickableIcons: false
                }}
                onClick={handleMapClick}
            >
                {currentPosition && (
                    <Marker position={currentPosition} draggable={true} onDragEnd={handleMarkerDragEnd} />
                )}

                {/* Request directions when both points are available */}
                {routeOrigin && routeDestination && !directions && (
                    <DirectionsService
                        options={{
                            origin: routeOrigin,
                            destination: routeDestination,
                            travelMode: window.google.maps.TravelMode.DRIVING,
                        }}
                        callback={(result, status) => {
                            if (status === window.google.maps.DirectionsStatus.OK) {
                                setDirections(result)
                            }
                        }}
                    />
                )}

                {directions && <DirectionsRenderer options={{ directions }} />}

                {/* Controls overlay */}
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 12 }}>
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>Driver Location</div>
                    <div style={{ marginBottom: 6 }}>Lat: {currentPosition?.lat?.toFixed?.(5) || '-'} | Lng: {currentPosition?.lng?.toFixed?.(5) || '-'}</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <input type='checkbox' checked={followGPS} onChange={(e) => setFollowGPS(e.target.checked)} />
                        Follow GPS
                    </label>
                    <button onClick={() => {
                        if (!mapRef.current) return
                        const center = mapRef.current.getCenter()
                        const lat = center.lat()
                        const lng = center.lng()
                        setCurrentPosition({ lat, lng })
                        setFollowGPS(false)
                        onPositionChanged?.({ lat, lng })
                        emitLocation(lat, lng)
                    }} style={{ padding: '6px 10px', borderRadius: 6, background: '#065f46', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Set driver at map center
                    </button>
                </div>
            </GoogleMap>
        </LoadScript>
    )
}

export default DriverMap



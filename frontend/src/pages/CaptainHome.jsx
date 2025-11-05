import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'

import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'
import DriverMap from '../components/DriverMap'

const CaptainHome = () => {
    const navigate = useNavigate()

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ ride, setRide ] = useState(null)
    const [ openRequests, setOpenRequests ] = useState([])
    const [ declinedIds, setDeclinedIds ] = useState([]) // array of ids to keep state updates simple
    const declinedIdsRef = useRef([])

    // Load declined IDs from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem('declinedRideIds')
            const parsed = raw ? JSON.parse(raw) : []
            setDeclinedIds(parsed)
            declinedIdsRef.current = parsed
        } catch {}
    }, [])

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    const [ driverCoords, setDriverCoords ] = useState(null)
    const [ pickupCoords, setPickupCoords ] = useState(null)

    useEffect(() => {
        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        })
        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {

                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: {
                            ltd: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    })
                    setDriverCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
                })
            }
        }

        const locationInterval = setInterval(updateLocation, 10000)
        updateLocation()

        // return () => clearInterval(locationInterval)
    }, [])

    socket.on('new-ride', (data) => {
        const id = data._id || data.id
        // Ignore if previously declined
        if (declinedIdsRef.current.includes(id)) return
        setRide(data)
        setRidePopupPanel(true)
        setOpenRequests(prev => {
            const exists = prev.some(r => (r._id || r.id) === id)
            return exists ? prev : [ data, ...prev ].slice(0, 10)
        })
    })

    async function confirmRide() {
        if (!ride?._id && !ride?.id) return
        const rideId = ride._id || ride.id
        // Use v1 accept to create Prisma trip for payment flow
        await axios.post(`${import.meta.env.VITE_BASE_URL}/v1/drivers/${captain._id}/accept`, {
            rideId
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })

        setRidePopupPanel(false)
        setConfirmRidePopupPanel(false)
        // Immediately move to riding view; no OTP confirmation step
        navigate('/captain-riding', { state: { ride } })
    }

    function declineRide() {
        const declinedId = ride?._id || ride?.id
        if (declinedId) {
            // Track declined id
            setDeclinedIds(prev => {
                const next = prev.includes(declinedId) ? prev : [ ...prev, declinedId ]
                declinedIdsRef.current = next
                try { localStorage.setItem('declinedRideIds', JSON.stringify(next)) } catch {}
                return next
            })
            // Remove from current list
            setOpenRequests(prev => prev.filter(r => (r._id || r.id) !== declinedId))
        }
        setRide(null)
        setPickupCoords(null)
    }

    // Geocode pickup for active/selected ride to show route to rider
    useEffect(() => {
        async function fetchPickupCoords() {
            try {
                const address = ride?.pickup
                if (!address) { setPickupCoords(null); return }
                const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                    params: { address },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                if (res.data?.ltd != null && res.data?.lng != null) {
                    setPickupCoords({ lat: res.data.ltd, lng: res.data.lng })
                } else {
                    setPickupCoords(null)
                }
            } catch {
                setPickupCoords(null)
            }
        }
        fetchPickupCoords()
    }, [ ride?.pickup ])

    // Poll nearby open rides based on current driver location
    useEffect(() => {
        if (!driverCoords) return
        let intervalId
        const fetchNearby = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/nearby-open`, {
                    params: { lat: driverCoords.lat, lng: driverCoords.lng, radiusKm: 2 },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                const rides = (response.data?.rides || []).filter(r => !declinedIdsRef.current.includes(r._id || r.id))
                setOpenRequests(rides)
            } catch {
                // ignore errors to keep UI responsive
            }
        }
        fetchNearby()
        intervalId = setInterval(fetchNearby, 10000)
        return () => { if (intervalId) clearInterval(intervalId) }
    }, [ driverCoords ])


    useGSAP(function () {
        if (ridePopupPanel) {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ ridePopupPanel ])

    useGSAP(function () {
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePopupPanel ])

    return (
        <div className='h-screen relative'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-20'>
                <div className='flex items-center gap-2'>
                    <div className='w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg'>
                        <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                        </svg>
                    </div>
                    <span className='text-xl font-bold text-white drop-shadow-lg'>goComet</span>
                </div>
                <Link to='/captain-home' className='h-10 w-10 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all'>
                    <i className="text-lg font-medium ri-logout-box-r-line text-gray-700"></i>
                </Link>
            </div>
            <div className='h-3/5'>
                <DriverMap
                    onPositionChanged={(pos) => setDriverCoords({ lat: pos.lat, lng: pos.lng })}
                    routeOrigin={driverCoords}
                    routeDestination={pickupCoords}
                />
            </div>
            <div className='h-2/5 p-6 bg-white/95 backdrop-blur-lg'>
                <CaptainDetails />
                {/* Riders looking now */}
                <div className='mt-4'>
                    <div className='flex items-center justify-between mb-2'>
                        <h4 className='text-base font-semibold text-gray-800'>Riders looking now</h4>
                        <span className='text-sm text-gray-600'>{openRequests.length}</span>
                    </div>
                    {openRequests.length === 0 ? (
                        <div className='text-sm text-gray-500'>No nearby requests yet.</div>
                    ) : (
                        <div className='space-y-2 max-h-40 overflow-auto'>
                    {openRequests.filter(r => !declinedIdsRef.current.includes(r._id || r.id)).map((r) => (
                                <div key={r._id || r.id} className='p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between'>
                                    <div className='min-w-0'>
                                        <div className='text-sm font-medium text-gray-900 truncate'>
                                            {(typeof r.user?.fullname === 'string' && r.user.fullname) ||
                                             (r.user?.fullname?.firstname ? `${r.user.fullname.firstname} ${r.user.fullname.lastname || ''}`.trim() : 'Rider')}
                                        </div>
                                        <div className='text-xs text-gray-600 truncate'>{r.pickup} → {r.destination}</div>
                                    </div>
                                    <button onClick={() => { setRide(r); setRidePopupPanel(true); }} className='text-xs px-2 py-1 rounded-md bg-emerald-600 text-white'>View</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    onDecline={declineRide}
                    confirmRide={confirmRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>
        </div>
    )
}

export default CaptainHome
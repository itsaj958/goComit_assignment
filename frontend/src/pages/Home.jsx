import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';


const Home = () => {
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ pickupCoords, setPickupCoords ] = useState(null)
    const [ destinationCoords, setDestinationCoords ] = useState(null)
    const [ pickupSelected, setPickupSelected ] = useState(false)
    const [ destinationSelected, setDestinationSelected ] = useState(false)
    const [ availableDrivers, setAvailableDrivers ] = useState([])

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        socket.emit("join", { userType: "user", userId: user._id, email: user.email })
    }, [ user ])

    // Listen to real-time driver availability via sockets
    useEffect(() => {
        const haversine = (lat1, lon1, lat2, lon2) => {
            const toRad = (deg) => (deg * Math.PI) / 180
            const R = 6371 // km
            const dLat = toRad(lat2 - lat1)
            const dLon = toRad(lon2 - lon1)
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            return R * c
        }

        const onDriverAvailable = (data) => {
            if (!pickupCoords || !data?.latitude || !data?.longitude) return
            const km = haversine(pickupCoords.ltd, pickupCoords.lng, data.latitude, data.longitude)
            if (km <= 2) {
                setAvailableDrivers((prev) => {
                    const exists = prev.some(d => d.id === data.driverId)
                    if (exists) return prev
                    return [ { id: data.driverId, name: 'Driver', location: { ltd: data.latitude, lng: data.longitude } }, ...prev ].slice(0, 10)
                })
            }
        }

        socket.on('driver-available', onDriverAvailable)
        return () => {
            socket.off('driver-available', onDriverAvailable)
        }
    }, [ socket, pickupCoords ])

    socket.on('ride-confirmed', ride => {
        // Legacy event: just open waiting panel; ride details (with OTP) will be fetched on 'ride-accepted'
        setVehicleFound(false)
        setWaitingForDriver(true)
    })

    socket.on('ride-started', ride => {
        console.log("ride")
        setWaitingForDriver(false)
        navigate('/riding', { state: { ride } }) // Updated navigate to include ride data
    })

    // v1: when driver accepts, fetch ride details (with OTP) and show waiting panel
    useEffect(() => {
        function onRideAccepted(data) {
            const id = data?.id || data?._id
            // Immediately show OTP from socket payload if present
            setRide(data)
            setVehicleFound(false)
            setWaitingForDriver(true)
            if (!id) return
            // Refresh ride from API to ensure latest state
            axios.get(`${import.meta.env.VITE_BASE_URL}/v1/rides/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then((resp) => {
                if (resp?.data) setRide(resp.data)
            }).catch(() => {})
        }
        socket.on('ride-accepted', onRideAccepted)
        return () => {
            socket.off('ride-accepted', onRideAccepted)
        }
    }, [ socket ])


    const handlePickupChange = async (e) => {
        setPickup(e.target.value)
        setPickupSelected(false)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }

            })
            setPickupSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const handleDestinationChange = async (e) => {
        setDestination(e.target.value)
        setDestinationSelected(false)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setDestinationSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
                // opacity:1
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
                // opacity:0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])

    // Auto-close suggestions panel when both fields are set
    // Do not auto-close here; handled explicitly when destination is selected

    // Auto-fetch fare and open vehicle panel when both fields are set
    useEffect(() => {
        async function maybeFindTrip() {
            if (pickupSelected && destinationSelected && !vehiclePanel) {
                await findTrip()
            }
        }
        maybeFindTrip()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ pickupSelected, destinationSelected ])

    // Geocode both addresses to coordinates for map markers and route
    useEffect(() => {
        async function fetchCoords() {
            try {
                if (pickup) {
                    const res1 = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                        params: { address: pickup },
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    })
                    setPickupCoords(res1.data)
                } else {
                    setPickupCoords(null)
                }
                if (destination) {
                    const res2 = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                        params: { address: destination },
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    })
                    setDestinationCoords(res2.data)
                } else {
                    setDestinationCoords(null)
                }
            } catch (e) {
                // ignore errors and keep UI responsive
            }
        }
        fetchCoords()
    }, [ pickup, destination ])


    async function findTrip() {
        setVehiclePanel(true)
        setPanelOpen(false)

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
            params: { pickup, destination },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })


        setFare(response.data)


    }

    async function createRide() {
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
            pickup,
            destination,
            vehicleType
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })


    }

    // Poll nearby drivers while looking for driver
    useEffect(() => {
        let intervalId;
        const fetchNearby = async () => {
            try {
                if (!pickupCoords) return;
                const resp = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/nearby-captains`, {
                    params: { lat: pickupCoords.ltd, lng: pickupCoords.lng, radiusKm: 2 },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAvailableDrivers(resp.data?.captains || []);
            } catch {
                // ignore errors to keep UI smooth
            }
        };
        if (vehicleFound) {
            fetchNearby();
            intervalId = setInterval(fetchNearby, 10000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [ vehicleFound, pickupCoords ])

    return (
        <div className='h-screen relative overflow-hidden'>
            {/* Logo */}
            <div className='absolute left-5 top-5 z-20 flex items-center gap-2'>
                <div className='w-12 h-12 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg'>
                    <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                    </svg>
                </div>
                <span className='text-xl font-bold text-white drop-shadow-lg'>goComet</span>
            </div>
            
            <div className='h-screen w-screen'>
                {/* image for temporary use  */}
                <LiveTracking
                    pickupCoords={pickupCoords}
                    destinationCoords={destinationCoords}
                    pickupLabel={pickup}
                    destinationLabel={destination}
                />
            </div>
            <div className=' flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className='h-[30%] p-6 bg-white/95 backdrop-blur-lg rounded-t-3xl shadow-2xl relative'>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl text-gray-600 cursor-pointer hover:text-gray-800'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-4'>Book Your Ride</h4>
                    <form className='relative py-3' onSubmit={(e) => {
                        submitHandler(e)
                    }}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gradient-to-b from-indigo-500 to-pink-500 rounded-full"></div>
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-gray-50 px-12 py-3 text-lg rounded-xl w-full border-2 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400'
                            type="text"
                            placeholder='Pick-up location'
                        />
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-gray-50 px-12 py-3 text-lg rounded-xl w-full mt-3 border-2 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder-gray-400'
                            type="text"
                            placeholder='Where to?' />
                    </form>
                    <button
                        onClick={findTrip}
                        className='bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-4 py-3 rounded-xl mt-4 w-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'>
                        Find Ride
                    </button>
                </div>
                <div ref={panelRef} className='bg-white/95 backdrop-blur-lg h-0 rounded-t-3xl'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                        pickup={pickup}
                        destination={destination}
                        setActiveField={setActiveField}
                        setPickupSelected={setPickupSelected}
                        setDestinationSelected={setDestinationSelected}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}

                    setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound}
                    availableDrivers={availableDrivers}
                    availableDriversCount={availableDrivers.length}
                />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full z-10 bottom-0 bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>
        </div>
    )
}

export default Home
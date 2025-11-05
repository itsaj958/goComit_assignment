import React, { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'

const CaptainRiding = () => {

    const [ finishRidePanel, setFinishRidePanel ] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const rideData = location.state?.ride



    useGSAP(function () {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ finishRidePanel ])


    return (
        <div className='h-screen relative flex flex-col justify-end'>

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

            <div className='h-1/5 p-6 flex items-center justify-between relative bg-gradient-to-r from-yellow-400 to-orange-500 pt-10 rounded-t-3xl shadow-2xl'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0' onClick={() => {

                }}><i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i></h5>
                <h4 className='text-xl font-semibold text-gray-800'>{'4 KM away'}</h4>
                <button className='bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold p-3 px-10 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'>Complete Ride</button>
            </div>
            <div ref={finishRidePanelRef} className='fixed w-full z-[500] bottom-0 translate-y-full bg-white rounded-t-3xl px-6 py-8 pt-12 shadow-2xl'>
                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel} />
            </div>

            <div className='h-screen fixed w-screen top-0 z-[-1]'>
                <LiveTracking />
            </div>

        </div>
    )
}

export default CaptainRiding
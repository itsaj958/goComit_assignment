import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'

const ConfirmRidePopUp = (props) => {
    const navigate = useNavigate()
    const { captain } = useContext(CaptainDataContext)

    const submitHander = async (e) => {
        e.preventDefault()

        // Immediately start ride on accept - no OTP
        const rideId = props.ride?._id || props.ride?.id
        if (!rideId || !captain?._id) return

        await axios.post(`${import.meta.env.VITE_BASE_URL}/v1/drivers/${captain._id}/accept`, {
            rideId
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        props.setConfirmRidePopupPanel(false)
        props.setRidePopupPanel(false)
        navigate('/captain-riding', { state: { ride: props.ride } })
    }
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-300 ri-arrow-down-wide-line hover:text-gray-400 transition-colors"></i></h5>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6'>Confirm to Start Ride</h3>
            <div className='flex items-center justify-between p-4 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl mt-4'>
                <div className='flex items-center gap-3'>
                    <div className='h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-md'>
                        {props.ride?.user.fullname.firstname.charAt(0).toUpperCase()}
                    </div>
                    <h2 className='text-lg font-semibold capitalize text-gray-800'>{props.ride?.user.fullname.firstname}</h2>
                </div>
                <div className='px-4 py-2 bg-white rounded-lg'>
                    <h5 className='text-lg font-bold text-gray-800'>2.2 KM</h5>
                </div>
            </div>
            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-4 border-b-2 border-gray-100'>
                        <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center'>
                            <i className="ri-map-pin-user-fill text-white"></i>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>Pickup</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-4 border-b-2 border-gray-100'>
                        <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center'>
                            <i className="text-lg ri-map-pin-2-fill text-white"></i>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>Destination</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-4'>
                        <div className='w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center'>
                            <i className="ri-currency-line text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>₹{props.ride?.fare} </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Payment</p>
                        </div>
                    </div>
                </div>

                <div className='mt-6 w-full'>
                    <form onSubmit={submitHander}>
                        {/* OTP removed: ride starts immediately on accept */}
                        <button className='w-full mt-1 text-lg flex justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'>Start Ride</button>
                        <button type="button" onClick={() => {
                            props.setConfirmRidePopupPanel(false)
                            props.setRidePopupPanel(false)

                        }} className='w-full mt-3 bg-red-500 text-lg text-white font-semibold p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'>Cancel</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ConfirmRidePopUp
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom' // Added useLocation
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import LiveTracking from '../components/LiveTracking'
import axios from 'axios'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {} // Retrieve ride data
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()
    const [ paymentInfo, setPaymentInfo ] = useState({ visible: false, status: '', amount: 0, receiptUrl: '' })

    socket.on("trip-ended", () => {
        navigate('/home')
    })

    // Show toast when backend emits payment completion via sockets
    socket.on('payment-completed', (data) => {
        setPaymentInfo({
            visible: true,
            status: data?.status || 'COMPLETED',
            amount: data?.amount || 0,
            receiptUrl: data?.receiptUrl || ''
        })
        setTimeout(() => setPaymentInfo((p) => ({ ...p, visible: false })), 5000)
    })
    async function handleMakePayment() {
        try {
            if (!ride?.id && !ride?._id) {
                alert('Ride info missing');
                return;
            }
            const rideId = ride.id || ride._id;
            // 1) Get ride status to obtain tripId
            const rideResp = await axios.get(`${import.meta.env.VITE_BASE_URL}/v1/rides/${rideId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const tripId = rideResp.data?.trip?.id;
            if (!tripId) {
                alert('Trip not found or not completed yet. Try again after trip ends.');
                return;
            }
            // 2) Process payment (simulate PSP)
            const payResp = await axios.post(`${import.meta.env.VITE_BASE_URL}/v1/payments`, {
                tripId,
                paymentMethod: 'credit_card'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const status = payResp.data?.payment?.status;
            const amount = payResp.data?.payment?.amount;
            const receiptUrl = payResp.data?.payment?.receiptUrl;
            setPaymentInfo({ visible: true, status, amount, receiptUrl })
            setTimeout(() => setPaymentInfo((p) => ({ ...p, visible: false })), 5000)
        } catch (e) {
            console.error('Payment error', e);
            setPaymentInfo({ visible: true, status: 'FAILED', amount: 0, receiptUrl: '' })
            setTimeout(() => setPaymentInfo((p) => ({ ...p, visible: false })), 5000)
        }
    }


    return (
        <div className='h-screen'>
            <Link to='/home' className='fixed right-4 top-4 h-12 w-12 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all z-20'>
                <i className="text-lg font-medium ri-home-5-line text-gray-700"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking />

            </div>
            <div className='h-1/2 p-6 bg-white/95 backdrop-blur-lg rounded-t-3xl'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='w-16 h-16 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg'>
                        <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
                        </svg>
                    </div>
                    <div className='text-right'>
                        <h2 className='text-lg font-semibold capitalize text-gray-800'>{ride?.captain.fullname.firstname}</h2>
                        <h4 className='text-xl font-bold text-gray-900 -mt-1 -mb-1'>{ride?.captain.vehicle.plate}</h4>
                        <p className='text-sm text-gray-600'>Maruti Suzuki Alto</p>

                    </div>
                </div>

                <div className='flex gap-2 justify-between flex-col items-center'>
                    <div className='w-full mt-5'>

                        <div className='flex items-center gap-5 p-4 border-b-2 border-gray-100'>
                            <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center'>
                                <i className="text-lg ri-map-pin-2-fill text-white"></i>
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800'>Destination</h3>
                                <p className='text-sm -mt-1 text-gray-600'>{ride?.destination}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-4'>
                            <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center'>
                                <i className="ri-currency-line text-white text-lg"></i>
                            </div>
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800'>₹{ride?.fare} </h3>
                                <p className='text-sm -mt-1 text-gray-600'>Cash Payment</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={handleMakePayment} className='w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'>Make Payment</button>
                {/* Payment toast */}
                {paymentInfo.visible && (
                    <div className='fixed right-4 bottom-4 bg-white shadow-xl rounded-lg p-4 border border-gray-100'>
                        <div className='text-sm text-gray-600'>Payment</div>
                        <div className='text-lg font-semibold mt-1'>{paymentInfo.status} {paymentInfo.amount ? `– $${paymentInfo.amount}` : ''}</div>
                        {paymentInfo.receiptUrl && (
                            <a href={paymentInfo.receiptUrl} target='_blank' rel='noreferrer' className='text-indigo-600 text-sm mt-1 inline-block'>View receipt</a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Riding

import React, { useContext } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainDetails = () => {

    const { captain } = useContext(CaptainDataContext)

    return (
        <div>
            <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center justify-start gap-3'>
                    <div className='h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                        {captain.fullname.firstname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className='text-lg font-semibold capitalize text-gray-800'>{captain.fullname.firstname + " " + captain.fullname.lastname}</h4>
                        <p className='text-sm text-gray-500'>Captain</p>
                    </div>
                </div>
                <div className='text-right'>
                    <h4 className='text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>₹295.20</h4>
                    <p className='text-sm text-gray-600'>Earned Today</p>
                </div>
            </div>
            <div className='flex p-4 mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl justify-center gap-6 items-start shadow-lg'>
                <div className='text-center'>
                    <div className='w-12 h-12 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3'>
                        <i className="text-2xl text-white ri-timer-2-line"></i>
                    </div>
                    <h5 className='text-xl font-bold text-gray-800'>10.2</h5>
                    <p className='text-sm text-gray-600 font-medium'>Hours Online</p>
                </div>
                <div className='text-center'>
                    <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3'>
                        <i className="text-2xl text-white ri-speed-up-line"></i>
                    </div>
                    <h5 className='text-xl font-bold text-gray-800'>12</h5>
                    <p className='text-sm text-gray-600 font-medium'>Rides Today</p>
                </div>
                <div className='text-center'>
                    <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3'>
                        <i className="text-2xl text-white ri-booklet-line"></i>
                    </div>
                    <h5 className='text-xl font-bold text-gray-800'>4.8</h5>
                    <p className='text-sm text-gray-600 font-medium'>Rating</p>
                </div>

            </div>
        </div>
    )
}

export default CaptainDetails
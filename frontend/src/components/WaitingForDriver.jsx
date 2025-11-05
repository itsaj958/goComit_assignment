import React from 'react'

const WaitingForDriver = (props) => {
  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => {
        props.waitingForDriver(false)
      }}><i className="text-3xl text-gray-300 ri-arrow-down-wide-line hover:text-gray-400 transition-colors"></i></h5>

      <div className='flex items-center justify-between mb-6'>
        <div className='w-16 h-16 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg'>
          <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
          </svg>
        </div>
        <div className='text-right'>
          <h2 className='text-lg font-semibold capitalize text-gray-800'>{props.ride?.captain.fullname.firstname}</h2>
          <h4 className='text-xl font-bold text-gray-900 -mt-1 -mb-1'>{props.ride?.captain.vehicle.plate}</h4>
          <p className='text-sm text-gray-600'>Maruti Suzuki Alto</p>
          {/* OTP removed: verification no longer required */}
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
      </div>
    </div>
  )
}

export default WaitingForDriver
import React from 'react'

const VehiclePanel = (props) => {
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => {
                props.setVehiclePanel(false)
            }}><i className="text-3xl text-gray-300 ri-arrow-down-wide-line hover:text-gray-400 transition-colors"></i></h5>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-6'>Choose Your Ride</h3>
            
            <div onClick={() => {
                props.setConfirmRidePanel(true)
                props.selectVehicle('car')
            }} className='flex border-2 border-gray-200 hover:border-indigo-500 active:border-indigo-600 mb-4 rounded-2xl w-full p-4 items-center justify-between cursor-pointer transition-all hover:shadow-lg'>
                <div className='w-14 h-14 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center'>
                    <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
                    </svg>
                </div>
                <div className='ml-3 w-1/2'>
                    <h4 className='font-semibold text-base text-gray-800'>goComet Go <span className='text-gray-600'><i className="ri-user-3-fill"></i>4</span></h4>
                    <h5 className='font-medium text-sm text-gray-600'>2 mins away </h5>
                    <p className='font-normal text-xs text-gray-500'>Affordable, compact rides</p>
                </div>
                <h2 className='text-xl font-bold text-gray-800'>₹{props.fare.car}</h2>
            </div>
            
            <div onClick={() => {
                props.setConfirmRidePanel(true)
                props.selectVehicle('moto')
            }} className='flex border-2 border-gray-200 hover:border-indigo-500 active:border-indigo-600 mb-4 rounded-2xl w-full p-4 items-center justify-between cursor-pointer transition-all hover:shadow-lg'>
                <div className='w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center'>
                    <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                    </svg>
                </div>
                <div className='ml-3 w-1/2'>
                    <h4 className='font-semibold text-base text-gray-800'>Moto <span className='text-gray-600'><i className="ri-user-3-fill"></i>1</span></h4>
                    <h5 className='font-medium text-sm text-gray-600'>3 mins away </h5>
                    <p className='font-normal text-xs text-gray-500'>Affordable motorcycle rides</p>
                </div>
                <h2 className='text-xl font-bold text-gray-800'>₹{props.fare.moto}</h2>
            </div>
            
            <div onClick={() => {
                props.setConfirmRidePanel(true)
                props.selectVehicle('auto')
            }} className='flex border-2 border-gray-200 hover:border-indigo-500 active:border-indigo-600 mb-2 rounded-2xl w-full p-4 items-center justify-between cursor-pointer transition-all hover:shadow-lg'>
                <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
                    <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
                    </svg>
                </div>
                <div className='ml-3 w-1/2'>
                    <h4 className='font-semibold text-base text-gray-800'>goComet Auto <span className='text-gray-600'><i className="ri-user-3-fill"></i>3</span></h4>
                    <h5 className='font-medium text-sm text-gray-600'>3 mins away </h5>
                    <p className='font-normal text-xs text-gray-500'>Affordable Auto rides</p>
                </div>
                <h2 className='text-xl font-bold text-gray-800'>₹{props.fare.auto}</h2>
            </div>
        </div>
    )
}

export default VehiclePanel
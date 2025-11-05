import React from 'react'

const LookingForDriver = (props) => {
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => {
                props.setVehicleFound(false)
            }}><i className="text-3xl text-gray-300 ri-arrow-down-wide-line hover:text-gray-400 transition-colors"></i></h5>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-6'>Looking for Driver</h3>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-24 h-24 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-pulse'>
                    <svg className='w-14 h-14 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
                    </svg>
                </div>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-4 border-b-2 border-gray-100'>
                        <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center'>
                            <i className="ri-map-pin-user-fill text-white"></i>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>Pickup</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-4 border-b-2 border-gray-100'>
                        <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center'>
                            <i className="text-lg ri-map-pin-2-fill text-white"></i>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>Destination</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-4'>
                        <div className='w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center'>
                            <i className="ri-currency-line text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold text-gray-800'>₹{props.fare[ props.vehicleType ]} </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Payment</p>
                        </div>
                    </div>
                    {/* Available drivers summary */}
                    <div className='mt-4 w-full p-4 bg-gray-50 rounded-xl border border-gray-100'>
                        <div className='flex items-center justify-between'>
                            <div className='text-sm text-gray-700'>Available drivers nearby</div>
                            <div className='text-base font-semibold text-gray-900'>{props.availableDriversCount ?? 0}</div>
                        </div>
                        {Array.isArray(props.availableDrivers) && props.availableDrivers.length > 0 && (
                            <div className='mt-3 flex -space-x-2'>
                                {props.availableDrivers.slice(0, 5).map((d, idx) => (
                                    <div key={d.id || idx} className='inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white text-xs shadow'>
                                        {String(d?.name ?? 'D').charAt(0).toUpperCase()}
                                    </div>
                                ))}
                                {props.availableDrivers.length > 5 && (
                                    <div className='inline-flex items-center justify-center h-8 w-8 rounded-full bg-white border text-xs text-gray-700 shadow'>
                                        +{props.availableDrivers.length - 5}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LookingForDriver
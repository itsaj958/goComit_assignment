import React from 'react'

const LocationSearchPanel = ({ suggestions, setVehiclePanel, setPanelOpen, setPickup, setDestination, activeField, pickup, destination, setActiveField, setPickupSelected, setDestinationSelected }) => {

    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion)
            if (setPickupSelected) setPickupSelected(true)
            // Always keep panel open and shift focus to destination
            if (setActiveField) setActiveField('destination')
            setPanelOpen(true)
        } else if (activeField === 'destination') {
            setDestination(suggestion)
            if (setDestinationSelected) setDestinationSelected(true)
            // Close only after destination is chosen
            if (pickup && pickup.length > 0) setPanelOpen(false)
        }
    }

    return (
        <div>
            {/* Display fetched suggestions */}
            {
                suggestions.map((elem, idx) => (
                    <div key={idx} onClick={() => handleSuggestionClick(elem)} className='flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start'>
                        <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                        <h4 className='font-medium'>{elem}</h4>
                    </div>
                ))
            }
        </div>
    )
}

export default LocationSearchPanel
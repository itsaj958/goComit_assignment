# GoComet DAW - v1 API Routes

All v1 API routes are properly implemented and match the specification.

## ✅ Implemented Routes

### 1. POST /v1/rides — Create a ride request
- **Route:** `POST /v1/rides`
- **Controller:** `rideController.createRide`
- **File:** `Backend/routes/v1/rides.routes.js`
- **Authentication:** Required (User)
- **Idempotency:** Supported (optional header)
- **Request Body:**
  ```json
  {
    "pickupAddress": "123 Main St",
    "pickupLat": 40.7128,
    "pickupLng": -74.0060,
    "destAddress": "456 Park Ave",
    "destLat": 40.7589,
    "destLng": -73.9851,
    "vehicleType": "CAR",
    "tier": "standard",
    "paymentMethod": "credit_card"
  }
  ```

### 2. GET /v1/rides/{id} — Get ride status
- **Route:** `GET /v1/rides/:id`
- **Controller:** `rideController.getRideStatus`
- **File:** `Backend/routes/v1/rides.routes.js`
- **Authentication:** Required (User)
- **URL Parameter:** `id` (ride ID)

### 3. POST /v1/drivers/{id}/location — Send driver location updates
- **Route:** `POST /v1/drivers/:id/location`
- **Controller:** `driverController.updateLocation`
- **File:** `Backend/routes/v1/drivers.routes.js`
- **Authentication:** Required (Driver)
- **Request Body:**
  ```json
  {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```
- **Performance:** Optimized for high frequency (1-2 updates/second)

### 4. POST /v1/drivers/{id}/accept — Accept ride assignment
- **Route:** `POST /v1/drivers/:id/accept`
- **Controller:** `driverController.acceptRide`
- **File:** `Backend/routes/v1/drivers.routes.js`
- **Authentication:** Required (Driver)
- **Idempotency:** Supported (optional header)
- **Request Body:**
  ```json
  {
    "rideId": "ride-123"
  }
  ```
- **Atomicity:** Uses database transaction to prevent race conditions

### 5. POST /v1/trips/{id}/end — End trip and trigger fare calculation
- **Route:** `POST /v1/trips/:id/end`
- **Controller:** `tripController.endTrip`
- **File:** `Backend/routes/v1/trips.routes.js`
- **Authentication:** Required (Driver)
- **Idempotency:** Supported (optional header)
- **URL Parameter:** `id` (trip ID)
- **Response:** Returns calculated fare with breakdown

### 6. POST /v1/payments — Trigger payment flow
- **Route:** `POST /v1/payments`
- **Controller:** `paymentController.processPayment`
- **File:** `Backend/routes/v1/payments.routes.js`
- **Authentication:** Required (User)
- **Idempotency:** Supported (optional header)
- **Request Body:**
  ```json
  {
    "tripId": "trip-123",
    "paymentMethod": "credit_card"
  }
  ```

## 📁 File Structure

```
Backend/
├── routes/
│   └── v1/
│       ├── index.js          # Aggregates all v1 routes
│       ├── rides.routes.js    # Routes 1 & 2
│       ├── drivers.routes.js  # Routes 3 & 4
│       ├── trips.routes.js   # Route 5
│       └── payments.routes.js # Route 6
├── controllers/
│   └── v1/
│       ├── ride.controller.js
│       ├── driver.controller.js
│       ├── trip.controller.js
│       └── payment.controller.js
└── app.js                    # Mounts /v1 routes
```

## 🔗 Route Mounting

All routes are mounted in `Backend/app.js`:
```javascript
const v1Routes = require('./routes/v1');
app.use('/v1', v1Routes);
```

This creates the following endpoint structure:
- `/v1/rides` → `routes/v1/rides.routes.js`
- `/v1/drivers` → `routes/v1/drivers.routes.js`
- `/v1/trips` → `routes/v1/trips.routes.js`
- `/v1/payments` → `routes/v1/payments.routes.js`

## ✅ Verification

All 6 routes are correctly implemented and match the specification:
- ✅ Route names match exactly
- ✅ HTTP methods are correct
- ✅ Controllers are implemented
- ✅ Authentication is enforced
- ✅ Validation is in place
- ✅ Idempotency is supported

## 🧪 Testing

Test the routes using curl or Postman:

```bash
# Create ride
curl -X POST http://localhost:3000/v1/rides \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress":"123 Main St","pickupLat":40.7128,...}'

# Get ride status
curl http://localhost:3000/v1/rides/{id} \
  -H "Authorization: Bearer <token>"

# Update driver location
curl -X POST http://localhost:3000/v1/drivers/{id}/location \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"latitude":40.7128,"longitude":-74.0060}'

# Accept ride
curl -X POST http://localhost:3000/v1/drivers/{id}/accept \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rideId":"ride-123"}'

# End trip
curl -X POST http://localhost:3000/v1/trips/{id}/end \
  -H "Authorization: Bearer <token>"

# Process payment
curl -X POST http://localhost:3000/v1/payments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tripId":"trip-123","paymentMethod":"credit_card"}'
```


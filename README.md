# Hotel Booking API

This API manages bookings and room availability for a hotel. It is built with a serverless architecture on AWS and uses DynamoDB to store booking data.

## Base URL

```plaintext
https://e7kbb8tatb.execute-api.eu-north-1.amazonaws.com/dev
```

## End Points
### 1. Search Available Rooms

- **Endpoint**: `/search-rooms`
- **Method**: `GET`
- **Description**: Retrieves available rooms based on the number of guests and the specified check-in and check-out date range.

#### Query Parameters

| Parameter   | Type    | Description                                                     |
|-------------|---------|-----------------------------------------------------------------|
| `guests`    | Integer | Number of guests                                                |
| `startDate` | String  | Check-in date in `yyyy-mm-dd` format                            |
| `endDate`   | String  | Check-out date in `yyyy-mm-dd` format                           |

#### Example Request
```plaintext
GET /search-rooms?guests=2&startDate=2024-11-01&endDate=2024-11-02
```

#### Example Response
```plaintext
{ 
    "single": {
        "beds": 1,
        "pricePerNight": 500,
        "availability": 1
    },
    "double": {
        "beds": 2,
        "pricePerNight": 1000,
        "availability": 10
    },
    "suit": {
        "beds": 2,
        "pricePerNight": 1500,
        "availability": 3
    }
}
```
Error: If not enough room for guests you get a error specifing not enough rooms available.

### 2. Book Rooms
- **Endpoint**: `/book-rooms`
- **Method**: `POST`
- **Description**: Creates a booking for specific room types over a date range.

#### Required JSON object in body

| Field       | Type    | Description                                                     |
|-------------|---------|-----------------------------------------------------------------|
| `name`      | String  | Guest's name                                                    |
| `email`     | String  | Guest's email address                                           |
| `startDate` | String  | Check-in date in `yyyy-mm-dd` format                            |
| `endDate`   | String  | Check-out date in `yyyy-mm-dd` format                           |
| `rooms`     | Array   | An array of room objects to be booked                           |
| `guests`    | Integer | Number of guests                                                |
#### Room Object Structure

| Field       | Type    | Description                                                     |
|-------------|---------|-----------------------------------------------------------------|
| `type`      | String  | Room type (`single`, `double`, `suite`)                         |
| `quantity`  | Integer | Number of rooms of the type.                                    |

#### Example Request
```plaintext
POST /book-rooms
```

#### Example Request Body
```plaintext
{
    "name": "Jöns",
    "email": "jans@jans.com",
    "guests": 2,
    "startDate": "2024-12-24",
    "endDate" : "2024-12-25",
    "rooms": [
        {
        "type": "single",
        "quantity": 2
        },
        {
        "type": "double",
        "quantity": 1
        }
    ]
}
```
#### Example Response
```plaintext
{
    "bookingNumber": "1c046e8d-7890-4bc9-a246-0342028f9c57",
    "numberOfGuests": 2,
    "numberOfRooms": [
        {
            "type": "single",
            "quantity": 1,
            "price": 500
        },
        {
            "type": "double",
            "quantity": 1,
            "price": 1000
        }
    ],
    "checkInDate": "2024-12-30",
    "checkOutDate": "2024-12-31",
    "bookerName": "Jäns",
    "totalPrice": 1500
}
```

### 3. Retrieve Booking Details
- **Endpoint**: `/retrive-bookings/`
- **Method**: `GET`
- **Description**: Retrieves all bookings.

#### Path Parameter
| Field      | Type    | Description                                                      |
|------------|---------|------------------------------------------------------------------|
| `id`       | String  | The unique ID of the booking                                     |

#### Example Request
```plaintext
GET /retrive-bookings/d48c6...
```
#### Query Parameters
| Parameter   | Type    | Description                                                     |
|-------------|---------|-----------------------------------------------------------------|
| `bookingId` | String  | Filter bookings by the unique booking ID                        |
| `name`      | String  | Filter bookings by the booker's name                            |
| `roomType`  | String  | Filter bookings by room type (single, double, suite)            |
| `startDate` | String  | Filter bookings that start on or after this date (yyyy-mm-dd)   |
| `endDate`   | String  | Filter bookings that end on or before this date (yyyy-mm-dd)    |

#### Example Request
```plaintext
GET /retrive-bookings?name=Alice Johnson
```

#### Example Response
```plaintext
{
  "bookingNumber": "d48c6...",
  "checkInDate": "2024-12-02",
  "checkOutDate": "2024-12-08",
  "numberOfGuests": 2,
  "numberOfRooms": 1,
  "bookerName": "Alice Johnson",
  "roomTypes": [
    { "type": "double", "quantity": 1 }
  ],
}
```

### 4. Update a Booking
- **Endpoint**: `/modify-booking`
- **Method**: `PUT`
- **Description**: Updates the details of an existing booking.
- **Note**: This endpoint is currently in the development phase.

#### Request Body JSON
| Field                 | Type    | Description                                           |
|-----------------------|---------|-------------------------------------------------------|
| `bookingId`           | String  | The unique ID of the booking                          |
| `guestName`           | String  | Guest's name                                          |
| `roomTypes`           | Array   | Array of room type objects to update                  |
| `numberOfGuests`      | Integer | Total number of guests                                |
| `originalCheckInDate` | String  | The original check-in date of the booking (yyyy-mm-dd)|

Room Type Object Structure
| Field                 | Type    | Description                                           |
|-----------------------|---------|-------------------------------------------------------|
| `type`                | String  | Room type (Single, Double, Suite)                     |
| `count`               | Integer | Number of rooms of this type                          |


#### Example Request Body
```plaintext
{
  "bookingId": "015",
  "guestName": "Alice",
  "originalCheckInDate": "2024-12-02",
  "roomTypes": [ { "type": "Double", "count": 1 } ],
  "numberOfGuests": 2
}
```

#### Example Response
```plaintext
{
  "status": "success",
  "message": "Booking successfully updated",
  "updatedBooking": {
    "PK": "Booking#015",
    "SK": "2024-12-02",
    "bookingID": "015",
    "name": "Alice",
    "startDate": "2024-12-02",
    "endDate": "2024-12-04",
    "rooms": [ { "type": "Double", "count": 1 } ],
    "numberOfGuests": 2
  }
}
```

### 5. Cancel a Booking
- **Endpoint**: `/cancel-booking/{id}/{date}`
- **Method**: `DELETE`
- **Description**: Cancels a booking based on the booking ID and date.

#### Path Parameter
| Parameter | Type    | Description                                                       |
|-----------|---------|-------------------------------------------------------------------|
| `id`      | String  | Booking ID to cancel                                              |
| `date`    | String  | Check-in date of booking                                          |

#### Example Request
```plaintext
DELETE /cancel-booking/d48c6.../2024-12-25
```

#### Example Response
```plaintext
{
  "message": "Booking canceled successfully",
  "bookingNumber": "d48c6..."
}
```


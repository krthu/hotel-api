const { getRoomObjects } = require('../getRoomObjects');
const { createErrorResponse, createSuccessResponse } = require('../../utils/responses');
const { getRoomTypes } = require('../../utils/bookingHelpers');

module.exports.handler = async (event, context) => {
    const { guests, startDate, endDate } = event.queryStringParameters || {};
    if (!guests || !startDate || !endDate) {
        return createErrorResponse("Missing required query parameters: guests, startDate, and endDate are all required.", 400);
    }
    if (endDate <= startDate) {
        return createErrorResponse("Enddate cant be earlier or same as the startdate", 400);
    }

    try {

        const rooms = await getRoomObjects(startDate, endDate);

        // If the days isn't present in db, it is nothing booked that day. Add info for unbooked rooms
        if (rooms.length === 0) {
            let newRooms = {
                rooms: getRoomTypes()
            }
            rooms.push(newRooms)
        }

        const lowestAvailabilityByRoomType = getLowestAvailabilityByRoomType(rooms);

        const beds = getNrOfBedsFree(lowestAvailabilityByRoomType);
        if (guests > beds) {
            return createErrorResponse("Not enough rooms available.", 400);
        }
        return createSuccessResponse(lowestAvailabilityByRoomType);

    } catch (error) {
        console.error('Error querying rooms:', error);
        return createErrorResponse("Error querying rooms", 503)
    }
}

const getLowestAvailabilityByRoomType = (rooms) => {
    const lowestAvailabilityByRoomType = {};
    rooms.forEach(day => {
        day.rooms.forEach(roomType => {
            const type = roomType.type;

            if (!lowestAvailabilityByRoomType[type]) {
                lowestAvailabilityByRoomType[type] = {
                    beds: roomType.beds,
                    pricePerNight: roomType.price,
                    availability: roomType.availability
                };
            } else {

                if (lowestAvailabilityByRoomType[type].availability > roomType.availability) {
                    lowestAvailabilityByRoomType[type].availability = roomType.availability;
                }
            }
        });
    });
    return lowestAvailabilityByRoomType;
}

const getNrOfBedsFree = (availability) => {
    var beds = 0
    Object.keys(availability).forEach(roomType => {
        const room = availability[roomType];
        beds += (room.beds * room.availability)
    })
    return beds
}


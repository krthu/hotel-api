const { unmarshall } = require("@aws-sdk/util-dynamodb");

function extractBookingData(item) {
    const itemData = unmarshall(item);

    console.log("Unmarshalled item data:", itemData);

    const roomTypes = (itemData.rooms || []).map(room => room.type || room.type);

    return {
        bookingNumber: itemData.PK.replace('Booking#', ''),
        checkInDate: itemData.startDate,
        checkOutDate: itemData.endDate,
        numberOfGuests: itemData.numberOfGuests,
        numberOfRooms: itemData.rooms ? itemData.rooms.length : 0,
        bookerName: itemData.name,
        roomTypes: roomTypes,
    };
}

function getRoomTypes(){
    return [
        {"type": "single", "beds": 1, "price": 500, "availability": 2, "bookings": [] },
        { "type": "double", "beds": 2, "price": 1000, "availability": 15, "bookings": [] },
        { "type": "suit", "beds": 2, "price": 1500, "availability": 3, "bookings": [] }
      ]
}


module.exports = {
    extractBookingData,
    getRoomTypes,
};

const { getRoomObjects } = require('./getRoomObjects');
const {
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const dynamoDb = require('../config/dynamodb');

module.exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    console.log("Request data:", data);

    if (
      !data.bookingId ||
      !data.roomTypes ||
      !data.numberOfGuests
    ) {
      console.error("Validation failed: Missing required fields");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const getCommand = new GetCommand({
      TableName: "HotelTable",
      Key: {
        PK: `Booking#${data.bookingId}`,
        SK: data.originalCheckInDate,
      },
    });

    const existingBookingResponse = await dynamoDb.send(getCommand);
    const existingBooking = existingBookingResponse.Item;

    if (!existingBooking) {
      console.error("Booking not found");
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Booking not found" }),
      };
    }

    const { startDate, endDate } = existingBooking;

    const totalCapacity = data.roomTypes.reduce((sum, room) => {
      const roomType = room.type.toLowerCase();
      if (roomType === "single") return sum + room.count * 1;
      if (roomType === "double") return sum + room.count * 2;
      if (roomType === "suite") return sum + room.count * 3;
      return sum;
    }, 0);

    console.log("Total capacity:", totalCapacity);

    if (totalCapacity < data.numberOfGuests) {
      console.error("Capacity check failed");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Number of rooms does not match the number of guests",
        }),
      };
    }

    const rooms = await getRoomObjects(startDate, endDate);
    console.log("Rooms fetched:", rooms);

    const isAvailable = checkAvailability(rooms, data.roomTypes);
    if (!isAvailable) {
      console.error("Room availability check failed");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Selected rooms are not available" }),
      };
    }

    const updatedItem = {
      ...existingBooking,
      name: data.guestName || existingBooking.name,
      rooms: data.roomTypes,
      numberOfGuests: data.numberOfGuests,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: "HotelTable",
        Item: updatedItem,
      })
    );

    console.log("Booking successfully updated");
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "success",
        message: "Booking successfully updated",
        updatedBooking: updatedItem,
      }),
    };
  } catch (error) {
    console.error("Error modifying booking:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating booking",
        error: error.message || "Unknown error",
      }),
    };
  }
};

function checkAvailability(rooms, requestedRoomTypes) {
  for (const requested of requestedRoomTypes) {
    const requestedType = requested.type.toLowerCase();
    const room = rooms.find((r) =>
      r.rooms.some((roomType) => roomType.type.toLowerCase() === requestedType)
    );

    if (!room) {
      console.warn("No room found for requested type:", requestedType);
      return false;
    }

    const availableRoom = room.rooms.find(
      (roomType) => roomType.type.toLowerCase() === requestedType
    );
    if (availableRoom.Availability < requested.count) {
      console.warn(
        `Room type ${requestedType} does not have enough availability. Needed: ${requested.count}, Available: ${availableRoom.Availability}`
      );
      return false;
    }
  }

  return true;
}

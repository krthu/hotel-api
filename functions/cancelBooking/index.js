const { GetItemCommand, TransactWriteItemsCommand } = require("@aws-sdk/client-dynamodb");
const dynamoDb = require('../../config/dynamodb');
const { generateDateRange } = require('../../utils/generateDateRange');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { createSuccessResponse, createErrorResponse } = require("../../utils/responses");
const { createTransactionItemsForRooms } = require("../../utils/dynamodbHelpers");
module.exports.handler = async (event, context) => {
  const bookingId = event.pathParameters.id;
  const checkInDate = event.pathParameters.date;
  if (!bookingId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Booking ID is required' }),
    };
  }

  const getParams = {
    TableName: "HotelTable",
    Key: {
      PK: { S: `Booking#${bookingId}` },
      SK: { S: checkInDate, }
    },
  };

  try {
    const getCommand = new GetItemCommand(getParams);

    const getResult = await dynamoDb.send(getCommand);

    if (!getResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Booking not found' }),
      };
    }
    console.log(getResult.Item)
    const bookingDate = getResult.Item.startDate.S;
    const bookingDateObj = new Date(bookingDate);
    const currentDate = new Date();

    const timeDifference = bookingDateObj.getTime() - currentDate.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

    if (daysDifference < 2) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bookings can only be canceled at least two days in advance' }),
      };
    }
    const booking = unmarshall(getResult.Item)
    console.log(booking);
    const dateList = generateDateRange(bookingDate, booking.endDate)

    const transactItems = getTransactItems(booking, dateList)
    const trasactParams = {
      TransactItems: transactItems,
    };
    try {

      await dynamoDb.send(new TransactWriteItemsCommand(trasactParams));
      // return createSuccessResponse(`Booking ${bookingId} canceled successfully`)
      return createSuccessResponse({ message: `Booking canceled successfully`, bookingNumber: bookingId })

    } catch (error) {
      console.log(error)
      return createErrorResponse(`Failed to delete ${bookingId}`)
    }

  } catch (error) {
    console.error('Error canceling booking:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not cancel booking' }),
    };
  }
};

const getTransactItems = (bookingData, dates) => {
  const roomsPerDateList = createBookingDataForDates(bookingData, dates)

  const transactItems = createTransactionItemsForRooms(roomsPerDateList, false)

  // Lägg till delete-objektet för att ta bort bokningen sist
  transactItems.push({
    Delete: {
      TableName: "HotelTable",
      Key: {
        PK: { S: `Booking#${bookingData.bookingID}` },
        SK: { S: bookingData.startDate }
      }
    }
  });

  return transactItems;
};

function createBookingDataForDates(bookingData, dates) {
  return dates.map(date => ({
    date: date,
    rooms: bookingData.rooms.map(room => ({
      price: room.price,
      quantity: room.quantity,
      type: room.type
    }))
  }));
}





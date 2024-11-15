const { marshall } = require('@aws-sdk/util-dynamodb');
const dynamoDb = require('../../config/dynamodb');
const { TransactWriteItemsCommand, BatchWriteItemCommand, PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { getRoomObjects } = require('../getRoomObjects');
const crypto = require('crypto');
const { validateBookingData } = require('../validateBookingData');
const { getBodyJson } = require('../getBodyJson');
const { generateDateRange } = require('../../utils/generateDateRange');
const { createErrorResponse, createSuccessResponse } = require('../../utils/responses');
const { createTransactionItemsForRooms } = require('../../utils/dynamodbHelpers');
const { getRoomTypes } = require('../../utils/bookingHelpers');


module.exports.handler = async (event, context) => {

    const bookingData = getBodyJson(event);

    if (bookingData.error) {
        return createErrorResponse(bookingData.error, 400)
    }
    const validData = validateBookingData(bookingData);
    if (!validData.valid) {
        return createErrorResponse(validData.message, 400)
    }
    const rooms = await getRoomObjects(bookingData.startDate, bookingData.endDate);

    // Kolla om det är några dagara som behöver skapas
    const dateList = generateDateRange(bookingData.startDate, bookingData.endDate);

    if (dateList.length != rooms.length) {
        // Om det är det skapa dagarna i databasen
        const missingDates = dateList.filter(date =>
            !rooms.some(room => room.SK === date)
        );
        await createRoomObjectsInDb(missingDates)
    }
    const bookingsPerDate = getBookingDataForEachDate(dateList, bookingData)

    const bookingOBJ = getBookingOBJ(bookingData, rooms[0])
    const result = (await bookRooms(bookingsPerDate, bookingOBJ));
    if (!result.success) {
        return createErrorResponse("Not enough rooms available.", 400)

    } else {
        const nights = dateList.length - 1
        const total = getTotalPrice(bookingOBJ.rooms, nights)

        const bookingDetails = {
            bookingNumber: bookingOBJ.bookingID,
            numberOfGuests: bookingOBJ.numberOfGuests,
            numberOfRooms: bookingOBJ.rooms,
            checkInDate: bookingOBJ.startDate,
            checkOutDate: bookingOBJ.endDate,
            bookerName: bookingOBJ.name,
            totalPrice: total
        }

        return createSuccessResponse(bookingDetails)
    }
}

const getBookingDataForEachDate = (dates, bookingData) => {
    const bookingForEachDate = []
    dates.forEach(date => {
        let booking = {
            date: date,
            rooms: bookingData.rooms
        }
        bookingForEachDate.push(booking)
    })
    return bookingForEachDate;
}

const createRoomObjectsInDb = async (dates) => {
    const roomObjects = []
    dates.forEach(date => {
        roomObjects.push(getNewRoomObjectForDate(date))
    });
    const putReq = roomObjects.map(room => ({
        PutRequest: {
            Item: marshall(room),
            ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)', // Kontrollera om PK och SK inte finns
        }
    }))
    const params = {
        RequestItems: {
            'HotelTable': putReq
        }
    }
    try {
        const data = await dynamoDb.send(new BatchWriteItemCommand(params));
    } catch (error) {
        console.error('Batch write failed:', error)
    }
}

const bookRooms = async (roomsPerDateList, bookingOBJ) => {

    const transactItems = createTransactionItemsForRooms(roomsPerDateList, true)

    const bookingParam = getPutParamsForBooking(bookingOBJ)
    transactItems.push(bookingParam);

    const params = {
        TransactItems: transactItems,
    };

    try {
        await dynamoDb.send(new TransactWriteItemsCommand(params));
        return { success: true };
    } catch (error) {

        return { success: false, error: error };
    }
};


const getNewRoomObjectForDate = (date) => {
    return newRoom = {
        "PK": "ROOMS",
        "SK": date,
        "rooms": getRoomTypes()
    }
}

const getBookingOBJ = (bookingData, room) => {

    if (room === undefined) {
        room = getNewRoomObjectForDate("dosent matter")// just to get the room types
    }
    var prices = {
    }
    room.rooms.forEach(type => {
        prices[type.type.toLowerCase()] = type.price
    })

    const bookedRooms = []
    bookingData.rooms.forEach(type => {

        const bookedType = {
            type: type.type.toLowerCase(),
            quantity: type.quantity,
            price: prices[type.type.toLowerCase()]
        }
        bookedRooms.push(bookedType);
    })
    const id = crypto.randomUUID();
    const bookingOBJ = {
        "PK": `Booking#${id}`,
        "SK": bookingData.startDate,
        bookingID: id,
        name: bookingData.name,
        email: bookingData.email,
        numberOfGuests: bookingData.guests,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        rooms: bookedRooms
    }
    return bookingOBJ;

}

const getPutParamsForBooking = (bookingOBJ) => {
    const bookingParam = {
        Put: {
            TableName: "HotelTable",
            Item: marshall(bookingOBJ)
        }
    };
    return bookingParam
}

const getTotalPrice = (rooms, nights) => {
    var total = 0
    rooms.forEach(room => {
        total += (room.quantity * room.price)
    })
    return (total * nights)
}
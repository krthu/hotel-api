const { QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { createSuccessResponse, createErrorResponse } = require('../../utils/responses');
const dynamoDb = require('../../config/dynamodb');
const { extractBookingData } = require('../../utils/bookingHelpers');
const { buildFilterExpression, buildKeyConditionExpression } = require('../../utils/dynamodbHelpers');

module.exports.handler = async (event, context) => {

    try {   
        const tableName = "HotelTable";
        const queryParams = event.queryStringParameters || {};

        if (queryParams.bookingId) {
            return await getBookingById(tableName, queryParams.bookingId);
        }

        return await filterBookings(tableName, queryParams);

    } catch (error) {
        console.error("Error retrieving bookings:", error);
        return createErrorResponse("Could not retrieve bookings");
    }
};

async function getBookingById(tableName, bookingId) {
    const params = {
        TableName: tableName,
        ...buildKeyConditionExpression(bookingId),
    };

    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);

    if (!data.Items || data.Items.length === 0) {
        return createErrorResponse("Booking not found", 404);
    }

    const booking = extractBookingData(data.Items[0]);
    return createSuccessResponse(booking);
}

async function filterBookings(tableName, queryParams) {
    const { FilterExpression, ExpressionAttributeValues, ExpressionAttributeNames } = buildFilterExpression(queryParams);

    const params = {
        TableName: tableName,
        FilterExpression,
        ExpressionAttributeValues,
        ...(ExpressionAttributeNames && { ExpressionAttributeNames })
    };

    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    const bookings = data.Items.map(item => extractBookingData(item));

    return createSuccessResponse(bookings);
}

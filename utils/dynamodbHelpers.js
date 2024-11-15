
function buildFilterExpression(queryParams) {
    let filterExpressions = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};

    filterExpressions.push("begins_with(PK, :pkPrefix)");
    expressionAttributeValues[":pkPrefix"] = { S: "Booking#" };

    if (queryParams.startDate && queryParams.endDate) {
        filterExpressions.push("#startDate >= :startDate AND #endDate <= :endDate");
        expressionAttributeNames["#startDate"] = "startDate";
        expressionAttributeNames["#endDate"] = "endDate";
        expressionAttributeValues[":startDate"] = { S: queryParams.startDate };
        expressionAttributeValues[":endDate"] = { S: queryParams.endDate };
    }

    if (queryParams.name) {
        filterExpressions.push("contains(#name, :name)");
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = { S: queryParams.name };
    }

    return {
        FilterExpression: filterExpressions.join(' AND '),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    };
}


function buildKeyConditionExpression(bookingId) {
    return {
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
            ":pk": { S: `Booking#${bookingId}` },
        },
    };
}

function getConditionExpretionsForRoomAvailability(rooms) {
    const conditionExpressionParts = rooms.map(room => {

        const typeIndex = roomTypeIndex(room.type);

        return `rooms[${typeIndex}].availability >= :${room.type}`;
    });
    const conditionExpression = conditionExpressionParts.join(' AND ');
    return conditionExpression;
}
function roomTypeIndex(type) {
    const roomTypes = ["single", "double", "suit"]; // Rumtyper i samma ordning som i DynamoDB-dokumentet
    return roomTypes.indexOf(type.toLowerCase());
}

function getUpdateExpressionAndExpressionValuesForRoomUpdates(rooms, subtractRooms) {
    const updateExpression = [];
    const expressionAttributeValues = {};

    rooms.forEach(room => {
        const { type, quantity } = room;

        // Lägg till uttryck för varje rumstyp
        const typeIndex = roomTypeIndex(type);  // Får index för rumstypen i Rooms-arrayen
        const operator = subtractRooms ? '-' : '+';

        updateExpression.push(`rooms[${typeIndex}].availability = rooms[${typeIndex}].availability ${operator} :${type}`);
        expressionAttributeValues[`:${type}`] = { N: quantity.toString() };
    });
    return{updateExpression: updateExpression, expressionAttributeValues: expressionAttributeValues}
}

function createTransactionItemsForRooms(roomsPerDateList, subtractRooms) {
    const transactItems = roomsPerDateList.map(roomsPerDate => {

        const { date, rooms } = roomsPerDate;

        const updatesAndValues = getUpdateExpressionAndExpressionValuesForRoomUpdates(rooms, subtractRooms);
        const {updateExpression, expressionAttributeValues} = updatesAndValues;
        const conditionExpression = subtractRooms ? getConditionExpretionsForRoomAvailability(rooms) : undefined;
       // const conditionExpression = getConditionExpretionsForRoomAvailability(rooms);

        const updateParams = {
            Update: {
                TableName: "HotelTable",
                Key: {
                    PK: { S: 'ROOMS' },
                    SK: { S: date },
                },
                UpdateExpression: 'SET ' + updateExpression.join(', '),
                ExpressionAttributeValues: expressionAttributeValues,
               
            }
        };
        if (conditionExpression) {
            updateParams.Update.ConditionExpression = conditionExpression;
        }


        return updateParams;
    });
    return transactItems;
}


module.exports = {
    buildFilterExpression,
    buildKeyConditionExpression,
    getConditionExpretionsForRoomAvailability,
    getUpdateExpressionAndExpressionValuesForRoomUpdates,
    createTransactionItemsForRooms,
};

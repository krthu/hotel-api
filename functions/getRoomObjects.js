
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const dynamoDb = require('../config/dynamodb');
const { QueryCommand } = require("@aws-sdk/client-dynamodb");

module.exports.getRoomObjects = async (startDate, endDate) => {
    
    console.log("Fetching rooms for:", { startDate, endDate });

    const params = {
        TableName: 'HotelTable',
        KeyConditionExpression: 'PK = :roomKey AND SK BETWEEN :startDate AND :endDate',
        ExpressionAttributeValues: {
            ':roomKey': { S: 'ROOMS' },       
            ':startDate': { S: startDate },  
            ':endDate': { S: endDate }       
        },
    };

    try {
        
        const data = await dynamoDb.send(new QueryCommand(params));
//        console.log("Raw data fetched from DynamoDB:", data.Items);

       
        if (!data.Items || data.Items.length === 0) {
            console.warn("No rooms found for the given period:", { startDate, endDate });
            return [];
        }

       
        const rooms = data.Items.map(item => unmarshall(item));
        //console.log("Unmarshalled rooms:", rooms);

        return rooms;
    } catch (error) {
        
        console.error('Error fetching rooms from DynamoDB:', error);
        throw error;
    }
};

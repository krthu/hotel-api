 const { DynamoDBClient, DeleteItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const dynamoDb = new DynamoDBClient();

module.exports.handler = async (event, context) => {
  const bookingId = event.pathParameters.id;

  console.log("Booking ID:", bookingId);

//Kontrollera att bokning finns.

  if (!bookingId) {
    return {
      statusCode: 400,
	@@ -17,8 +17,8 @@ module.exports.handler = async (event, context) => {


//hämta boknings info och kontrollera om det är mer än 2dar
//kvar till det bokade datumet.

  const getParams = {
    TableName: "HotelTable",
    Key: {
	@@ -54,14 +54,14 @@ module.exports.handler = async (event, context) => {


  //delete av bokning
  const params = {
    TableName: "HotelTable",
    Key: {
      PK: { S: `Booking#${bookingId}` },
      SK: { S: "DETAILS" }, 
    },
  };

    const command = new DeleteItemCommand(params);
    await dynamoDb.send(command);

	@@ -76,6 +76,4 @@ module.exports.handler = async (event, context) => {
      body: JSON.stringify({ error: 'Could not cancel booking' }),
    };
  }
};

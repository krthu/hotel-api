const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");  // Importera ScanCommand

// Kolla om vi är offline (utvecklingsläge)
const isOffline = false;

let dynamoDb;

if (isOffline) {
  // Konfigurera för DynamoDB Local (lokalt utvecklingsläge)
  dynamoDb = new DynamoDBClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000', // DynamoDB Local
    credentials: {
      accessKeyId: 'MockAccessKeyId',
      secretAccessKey: 'MockSecretAccessKey'
    },
  });
} else {
  // Konfigurera för AWS DynamoDB
  dynamoDb = new DynamoDBClient();
}

module.exports = dynamoDb;
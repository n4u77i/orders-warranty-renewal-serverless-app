/**
 * DynamoDB Client - AWS SDK for JS v3
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

/**
 * Difference between DynamoDB client (@aws-sdk/client-dynamodb) and DocumentDB client (@aws-sdk/lib-dynamodb)
 * https://stackoverflow.com/questions/57804745/difference-between-aws-sdk-dynamodb-client-and-documentclient
 * 
 * DocumentDB Client - AWS SDK for JS v3
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_lib_dynamodb.html
 */
import { PutCommand, PutCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

// Optionally pass region but by default it sets region where Lambda is deployed
const dynamoClient = new DynamoDBClient({})

export const dynamo = {
    // Variable <data> will be of type Object which takes string as key and anything as value - Record<string, any>
    write: async (tableName: string, data: Record<string, any>) => {
        
        // PutCommandInput will prepare the input data we need to write to the dynamo table
        const params: PutCommandInput = {
            TableName: tableName,
            Item: data
        }

        // PutCommand will create the command for write
        const command = new PutCommand(params)

        await dynamoClient.send(command)

        return data
    },

    update: async (tableName: string, data: Record<string, any>, key: Record<string, any>) => {
        const { TTL, expired, warrantyExpiry, sk } = data

        /**
         * UpdateCommandInput will prepare the input data we need to update in the dynamo table
         * API Reference: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
         * Update using AWS SDK: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_UpdateItem_section.html
         * NodeJS DynamoDB updateItem: https://stackoverflow.com/questions/41915438/node-js-aws-dynamodb-updateitem
         */
        const params: UpdateCommandInput = {
            TableName: tableName,
            Key: key,

            /**
             * To set substitution names for attributes used in an expression for referencing
             * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html#DDB-UpdateItem-request-ExpressionAttributeNames
             */
            ExpressionAttributeNames: {
                '#timeToLive': 'TTL',
                '#expiredKey': 'expired',
                '#warrantyExpireyKey': 'warrantyExpiry',
                '#skKey': 'sk'
            },
            UpdateExpression: "SET #expiredKey = :expiredVal, #timeToLive = :ttlVal, #warrantyExpireyKey = :warrantyExpiryVal, #skKey = :skVal",

            /**
             * A kind of substitution table to define value for a substitution
             * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html#DDB-UpdateItem-request-ExpressionAttributeValues
             * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/queryinput.html#expressionattributevalues
             */
            ExpressionAttributeValues: {
                ':ttlVal': TTL,
                ':expiredVal': expired,
                ':warrantyExpiryVal': warrantyExpiry,
                ':skVal': sk
            },
        }

        // UpdateCommand will create the command for write
        const command = new UpdateCommand(params)

        await dynamoClient.send(command)

        return data
    }
}
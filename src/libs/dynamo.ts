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
        const params: UpdateCommandInput = {
            TableName: tableName,
            Key: key,
            AttributeUpdates: data
        }

        const command = new UpdateCommand(params)

        await dynamoClient.send(command)

        return data
    }
}
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
import { PutCommand, PutCommandInput, 
    UpdateCommand, UpdateCommandInput, 
    QueryCommand, QueryCommandInput,
    GetCommand, GetCommandInput,
} from '@aws-sdk/lib-dynamodb';

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
    },

    /**
     * A thread in StackOverflow explaining when to use following of the operations for reading record(s) from dynamodb
     * https://stackoverflow.com/a/12248430
     * 
     * The image in thread when to use:
     * Scan
     * Query
     * GetItem
     * BatchGetItem
     */

    query: async ({
        tableName,
        index,

        // Value of the partition key (required)
        pkValue,

        /**
         * Name of partition key defined in index1 in dynamoResources.ts that is <pk>
         * If querying on index1, the <pkKey> will be 'pk'
         * But if querying on index2 in the future, that could be a different partion key
         * For now, defaulting it to 'pk'
         */
        pkKey = 'pk',

        // Value of the partition key (required)
        skValue,

        /**
         * Name of sort key defined in index1 in dynamoResources.ts that is <sk>
         * If querying on index1, the <skKey> will be 'sk'
         * But if querying on index2 in the future, that could be a different partion key
         * For now, defaulting it to 'sk'
         */
        skKey = 'sk',

        sortAscending = true,
    }: {
        tableName: string,
        index: string,
        pkValue: string,
        pkKey?: string,
        skValue?: string,
        skKey?: string,
        sortAscending?: boolean,
    }) => {
        // If sort key value is passed
        const skExpression =  skValue ? ` AND ${skKey} = :rangeValue` : ''

        /**
         * QueryCommandInput will prepare the data for query in the dynamo table
         * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#API_Query_RequestSyntax
         */
        const params: QueryCommandInput = {
            TableName: tableName,
            IndexName: index,

            /**
             * A little bit kind of query to interact with data like SQL query but works very slightly differently
             * :hashValue is a substitution for adding values dynamically
             * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-KeyConditionExpression
             * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/queryinput.html#keyconditionexpression
             */
            KeyConditionExpression: `${pkKey} = :hashValue${skExpression}`,

            /**
             * A kind of substitution table to define value for a substitution
             * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-ExpressionAttributeValues
             * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/queryinput.html#expressionattributevalues
             */
            ExpressionAttributeValues: {
                ':hashValue': pkValue,
            },

            /**
             * Define sort order for the query result
             * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-ScanIndexForward
             * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/queryinput.html#scanindexforward
             */
            ScanIndexForward: sortAscending,
        }

        // Is sort key value is passed, adding value for <skKey> substitution
        if (skValue) {
            params.ExpressionAttributeValues[':rangeValue'] = skValue
        }

        // QueryCommand will create the command for querying
        const command = new QueryCommand(params)

        const response = await dynamoClient.send(command)

        // Array of items which matches the query
        return response.Items
    },

    get: async ({
        tableName,
        key,
    }: {
        tableName: string,
        key: Record<string, any>
    }) => {
        /**
         * GetCommandInput will prepare the data for getting single item from the dynamo table
         * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_lib_dynamodb.html#getcommandinput-2
         * https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-example-table-read-write.html#dynamodb-example-table-read-write-getting-an-item
         */
        const params: GetCommandInput = {
            TableName: tableName,
            Key: key
        }

        // GetCommand will create the command for getting single item
        const command = new GetCommand(params)

        const response = await dynamoClient.send(command)

        return response.Item
    }
}
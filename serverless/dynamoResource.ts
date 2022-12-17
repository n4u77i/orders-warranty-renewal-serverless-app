import { AWS } from "@serverless/typescript";

// Defining the dynamoDB resource
const dynamoResource: AWS['resources']['Resources'] = {
    orderTable: {
        Type: 'AWS::DynamoDB::Table',            // Type of resource

        // Creating a DynamoDB table: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
        Properties: {
            // Using serverless CUSTOM variable, the value will be defined in serverles.ts and referenced here
            TableName: '${self:custom.orderTable}',

            // Defining table attributes (columns)
            AttributeDefinitions: [
                {
                    // ID attribute of type string
                    AttributeName: 'id',
                    AttributeType: 'S',
                },

                // Adding two more attributes <pk> and <sk> as Global Secondary Index for querying data by these attributes
                {
                    // ID attribute of type string
                    AttributeName: 'pk',
                    AttributeType: 'S',
                },
                {
                    // ID attribute of type string
                    AttributeName: 'sk',
                    AttributeType: 'S',
                },
            ],

            /**
             * Defining the key for table to lookup
             * Key Schema: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-dynamodb-table-keyschema.html
             */
            KeySchema: [
                {
                    // ID attribute will be the key
                    AttributeName: 'id',

                    // The type will be HASH which is for uniquely identifying
                    KeyType: 'HASH',
                }
            ],

            // Defining the type of billing we want to use
            BillingMode: 'PAY_PER_REQUEST',

            // Need to setup stream so whenever data changes (delete in our case), this prop will stream data to lambda (send data to lambda)
            StreamSpecification: {
                // Indicates whether DynamoDB Streams is to be enabled (true) or disabled (false)
                StreamEnabled: true,

                /**
                 * StreamViewTypes determines what kind of data we want to send in the stream to view
                 * There are four types of StreamViewTypes
                 * KEYS_ONLY - Only the key attributes of updated object
                 * NEW_IMAGE - The updated or newly created object
                 * OLD_IMAGE - The deleted or before the object was updated
                 * NEW_AND_OLD_IMAGES - Both before and after the object was updated 
                 */
                StreamViewType: 'OLD_IMAGE',
            },

            /**
             * Adding a TTL, which will delete the record at the specified TTL
             * A dynamo stream will be then added which will trigger the lambda to get the deleted record everytime it is deleted
             * A dynamo stream is used to trigger AWS services whenever there is a change in the dynamo db table data
             * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateTimeToLive.html
             */
            TimeToLiveSpecification: {
                AttributeName: 'TTL',
                Enabled: true,                          // Sets to true to enable TTL deletion
            },

            /**
             * Global Secondary Index is used for quering on different combination of columns
             * Format: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html#DDB-CreateTable-request-GlobalSecondaryIndexes
             * Usage: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
             */
            GlobalSecondaryIndexes: [
                {
                    // The name of the global secondary index. Must be unique only for this table
                    IndexName: 'index1',

                    /**
                     * Adding <pk> and <sk> to GSI (Global Secondary Index)
                     * Key Schema: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-dynamodb-table-keyschema.html
                     */
                    KeySchema: [
                        {
                            AttributeName: 'pk',

                            // The type will be HASH which is for uniquely identifying
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'sk',
                            
                            // The type will be RANGE which is for sorting
                            KeyType: 'RANGE',
                        },
                    ],

                    /**
                     * Specifies attributes that are copied (projected) from the table into the index
                     * Projection Types: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Projection.html#DDB-Type-Projection-ProjectionType
                     */
                    Projection: {
                        // All of the table attributes are copied (projected) into the index
                        ProjectionType: 'ALL'
                    }
                }
            ]
        }
    }
}

export default dynamoResource;
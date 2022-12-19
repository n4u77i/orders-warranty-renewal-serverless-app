import { AWS } from '@serverless/typescript';

const functions: AWS['functions'] = {
    // Serverless HttpApi: https://www.serverless.com/framework/docs/providers/aws/events/http-api
    createOrder: {
        // Lambda handler function path
        handler: 'src/functions/createOrder/index.handler',

        // Event to trigger lambda function
        events: [
            {
                httpApi: {
                    path: '/',
                    method: 'post'
                }
            }
        ]
    },

    sendOrder: {
        // Lambda function path
        handler: 'src/functions/sendOrder/index.handler',

        // Event to trigger lambda function
        events: [
            {
                /**
                 * Stream input event type
                 * https://www.serverless.com/framework/docs/providers/aws/events/streams
                 */
                stream: {
                    type: 'dynamodb',

                    // Setting stream ARN for dynamoDB dynamically by getting attribute of dynamodb <orderTable>
                    arn: {
                        // Getting StreamArn attribute from <orderTable> defined in dynamoResources.ts
                        "Fn::GetAtt": [
                            'orderTable', 
                            'StreamArn'
                        ]
                    },

                    /**
                     * Lambda will only get triggered when the REMOVE event will happen (record will be deleted)
                     * There are three types of events:
                     * INSERT: When new item is added to the table
                     * MODIFY: One or more of an existing item's attributes are modified
                     * REMOVE: When the item is deleted from the table
                     * Ref: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_streams_Record.html
                     * 
                     * Usage in Serverless: https://www.serverless.com/framework/docs/providers/aws/events/streams#setting-filter-patterns
                     */
                    filterpatterns: {
                        eventName: ['REMOVE']
                    }
                }
            }
        ]
    }
}

export default functions;
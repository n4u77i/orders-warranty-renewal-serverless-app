/**
 * SNS Client - AWS SDK for JS v3: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sns/index.html
 * SES Client - AWS SDK for JS v3: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ses/index.html
 */
import { SNSClient } from '@aws-sdk/client-sns';
import { SESClient } from '@aws-sdk/client-ses';

import { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { formatJSONResponse } from '@libs/apiGateway';

const snsClient = new SNSClient({})
const sesClient = new SESClient({})

export const handler = async (event: DynamoDBStreamEvent) => {
    try {
        const orderPromises = event.Records.map(async (order) => {
            /**
             * Unmarshalling is the process of converting data from DynamoDB JSON format to normal JSON format
             * DynamoDB JSON format: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.LowLevelAPI.html
             * 
             * Explicitly defining the type of <record.dynamodb.OldImage> if the <OldImage> doesn't exist instead if we had set it to <NewImage>
             */
            const data = unmarshall(order.dynamodb.OldImage as Record<string, AttributeValue>)

            const { companyName, carName, email, phoneNumber } = data

            if (email) {
                await sendEmail({email, companyName, carName})
            }

            if (phoneNumber) {
                await sendSMS({phoneNumber, companyName, carName})
            }
        })

        Promise.all(orderPromises)
    } catch (error) {
        console.log('Error: ', error)
        return formatJSONResponse({
            statusCode: 502,
            data: {
                message: error.message
            }
        })
    }
}

const sendEmail = async ({
    email,
    companyName,
    carName,
}: {
    email: string,
    companyName: string,
    carName: string,
}) => {
    
}

const sendSMS = async ({
    phoneNumber,
    companyName,
    carName,
}: {
    phoneNumber: string,
    companyName: string,
    carName: string,
}) => {
    
}
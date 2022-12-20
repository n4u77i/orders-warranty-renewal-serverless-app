/**
 * SNS Client - AWS SDK for JS v3: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sns/index.html
 * SES Client - AWS SDK for JS v3: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ses/index.html
 */
import { SNSClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

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

            const { companyName, carName, email, phoneNumber, orderId } = data

            if (email) {
                await sendEmail({email, companyName, carName, orderId})
            }

            if (phoneNumber) {
                await sendSMS({phoneNumber, companyName, carName, orderId})
            }
        })

        await Promise.all(orderPromises)
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
    orderId,
}: {
    email: string,
    companyName: string,
    carName: string,
    orderId: string,
}) => {
    /**
     * SendEmailCommandInput will prepare the input data to send email from SES
     * https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html
     * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property
     */
    const params: SendEmailCommandInput = {
        Source: 'batch17.94@gmail.com',
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Charset: 'UTF-8',
                Data: `${companyName} Warranty expired`
            },
            Body: {
                Text: {
                    Charset: 'UTF-8',
                    Data: `Your warranty has been expired against order number ${orderId}. You ordered ${companyName} ${carName}`
                }
            }
        }
    }

    // SendEmailCommand will create the command for sending email
    const command = new SendEmailCommand(params)
    const response = await sesClient.send(command)

    return response.MessageId
}

const sendSMS = async ({
    phoneNumber,
    companyName,
    carName,
    orderId,
}: {
    phoneNumber: string,
    companyName: string,
    carName: string,
    orderId: string,
}) => {
    /**
     * PublishCommandInput will prepare the input data to send SMS from SNS
     * https://docs.aws.amazon.com/sns/latest/api/API_Publish.html
     * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#publish-property
     */
    const params: PublishCommandInput = {
        PhoneNumber: phoneNumber,
        Message: `Your warranty has been expired against order number ${orderId}. You ordered ${companyName} ${carName}`
    }

    // PublishCommand will create the command for sending SMS
    const command = new PublishCommand(params)
    const response = await snsClient.send(command)

    return response.MessageId
}
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
import { dynamo } from '@libs/dynamo';
import { v4 as uuid } from 'uuid';

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

            const { companyName, carName, email, phoneNumber, orderId, expired } = data

            if (!expired) {
                if (email) {
                    const orderRenewalId = await createOrderForRenewal({userId: email, companyName, carName, isEmail: true})
                    await sendEmail({email, companyName, carName, orderId, orderRenewalId})
                }
    
                if (phoneNumber) {
                    const orderRenewalId = await createOrderForRenewal({userId: phoneNumber, companyName, carName, isEmail: false})
                    await sendSMS({phoneNumber, companyName, carName, orderId, orderRenewalId})
                }
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
    orderRenewalId,
}: {
    email: string,
    companyName: string,
    carName: string,
    orderId: string,
    orderRenewalId: string,
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
                    Data: `Your warranty has been expired against order number ${orderId}. You ordered ${companyName} ${carName}\n`
                            + `Click the link to renew order ${process.env.baseUrl}/renew/orderId?=${orderRenewalId}`
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
    orderRenewalId,
}: {
    phoneNumber: string,
    companyName: string,
    carName: string,
    orderId: string,
    orderRenewalId: string,
}) => {
    /**
     * PublishCommandInput will prepare the input data to send SMS from SNS
     * https://docs.aws.amazon.com/sns/latest/api/API_Publish.html
     * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#publish-property
     */
    const params: PublishCommandInput = {
        PhoneNumber: phoneNumber,
        Message: `Your warranty has been expired against order number ${orderId}. You ordered ${companyName} ${carName}\n`
                    + `Click the link to renew order ${process.env.baseUrl}/renew/orderId?=${orderRenewalId}`
    }

    // PublishCommand will create the command for sending SMS
    const command = new PublishCommand(params)
    const response = await snsClient.send(command)

    return response.MessageId
}

const createOrderForRenewal = async ({
    userId,
    companyName,
    carName,
    isEmail,
}: {
    userId: string,
    companyName: string,
    carName: string,
    isEmail: boolean,
}) => {
    /**
     * Warranty is expired after TWO years when the order was created
     * Now the warranty renew link will be valid for 30-days
     * The date will be set according to the timezone of region where the lambda will be deployed
     */
    const date = new Date()
    date.setDate(date.getDate() + 30)

    const data = {
        /**
         * Conditionally adding key
         * If <isEmail> is true, email key will be added, otherwise phoneNumber key will be added
         */
        ...(isEmail ? { email: userId } : { phoneNumber: userId }),
        
        companyName,
        carName,

        orderId: uuid(),

        /**
         * TTL is then value when the record should expire
         * In JS, time is in milli-seconds so date.getTime() function will return the number of milli-secs but TTL requires time in seconds
         * If number of milli-secs are not converted to secs, TTL will consider milli-secs as seconds and it will take much much longer to expire
         */
        TTL: date.getTime() / 1000,
        
        /**
         * We need two extra columns in the database which will be used to query data
         * Partion Key (pk): Used to group things by, in our case it is <userId> on which we will group by
         * Sort key (sk): To define the order in which the query result should come back in
         * Both <pk> and <sk> need to be string values
         */
        pk: userId,
        sk: date.toString(),

        /**
         * The warranty is expired now
         * This field will be removed if the user renews the warranty
         */
        expired: true,
        warrantyExpiry: date.getTime(),
    }

    // Getting env variables from serverless.ts file environment variables
    const tableName = process.env.orderTable

    await dynamo.write(tableName, data)

    return data.orderId
}
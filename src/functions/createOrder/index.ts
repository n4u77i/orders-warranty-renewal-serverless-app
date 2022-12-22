import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuid } from 'uuid';

export const handler = async(event: APIGatewayProxyEvent) => {
    try {
        // Converting the stringified body to JSON
        const body = JSON.parse(event.body)

        // Getting env variables from serverless.ts file environment variables
        const tableName = process.env.orderTable

        const { companyName, carName, email, phoneNumber } = body
        const validateErrors = validateInputs({ companyName, carName, email, phoneNumber })

        if (validateErrors) {
            return validateErrors
        }

        const userId = email || phoneNumber
        
        /**
         * Warranty will expire after TWO years when the order is created
         * The date will be set according to the timezone of region where the lambda will be deployed
         */
        const date = new Date()
        date.setFullYear(date.getFullYear() + 2)

        const data = {
            // <body> is spreaded at top because if for some reason <pk> is passed to the event, then it shouldn't override the <pk> we defined below
            ...body,

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

            warrantyExpiry: date.getTime()
        }

        // Writing to dynamo table
        await dynamo.write(tableName, data)

        return formatJSONResponse({
            data: {
                orderId: data.orderId,
                message: `The order is being made and the warranty will expire on ${new Date(date).toDateString()}`,
            }
        })
    } catch (err) {
        console.log('Error', err)
        return formatJSONResponse({
            statusCode: 502,
            data: {
                message: err.message
            }
        })
    }
}

const validateInputs = ({
    email,
    phoneNumber,
    companyName,
    carName,
}: {
    email?: string,
    phoneNumber?: string,
    companyName: string,
    carName: string,
}) => {
    // If both of email and phoneNumber are not passed
    if (!email && !phoneNumber) {
        return formatJSONResponse({
            statusCode: 400,
            data: {
                message: 'email or phoneNumber is required to make the order'
            }
        })
    }

    if (!companyName) {
        return formatJSONResponse({
            statusCode: 400,
            data: {
                message: 'companyName is missing to make the order'
            }
        })
    }

    if (!carName) {
        return formatJSONResponse({
            statusCode: 400,
            data: {
                message: 'carName is missing to make the order'
            }
        })
    }

    return
}
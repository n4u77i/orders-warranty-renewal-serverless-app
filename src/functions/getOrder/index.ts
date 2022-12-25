import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { APIGatewayProxyEvent } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        // Getting <orderId> passed in the URL path params
        const { orderId } = event.pathParameters || {}

        // Getting table name from serverless.ts file
        const tableName = process.env.orderTable

        if (!orderId) {
            return formatJSONResponse({
                statusCode: 400,
                data: {
                    message: 'Missing orderId in path of URL'
                }
            })
        }

        const key = {
            orderId
        }

        const data = await dynamo.get({ tableName, key })

        return formatJSONResponse({
            data
        })
    } catch (error) {
        console.log('Error: ', error)
        return formatJSONResponse({
            statusCode: 500,
            data: {
                message: error.message
            }
        })
    }
}
import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { APIGatewayProxyEvent } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        // Getting <userId> passed in the URL path params
        const { userId } = event.pathParameters || {}

        // Getting table name from serverless.ts file
        const tableName = process.env.orderTable

        if (!userId) {
            return formatJSONResponse({
                statusCode: 400,
                data: {
                    message: 'Missing userId in path of URL'
                }
            })
        }

        const data = await dynamo.query({ tableName, index: 'index1', pkValue: userId })

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
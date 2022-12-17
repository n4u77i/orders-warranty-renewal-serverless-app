import { formatJSONResponse } from "@libs/apiGateway";
import { APIGatewayProxyEvent } from "aws-lambda";

export const handler = async(event: APIGatewayProxyEvent) => {
    
    return formatJSONResponse({
        data: {}
    })
}
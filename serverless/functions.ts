import { AWS } from '@serverless/typescript';

const functions: AWS['functions'] = {
    // Serverless HttpApi: https://www.serverless.com/framework/docs/providers/aws/events/http-api
    setOrder: {
        // Lambda handler function path
        handler: 'src/functions/setOrder/index.handler',

        // Event to trigger lambda function
        events: [
            {
                httpApi: {
                    path: '/',
                    method: 'post'
                }
            }
        ]
    }
}

export default functions;
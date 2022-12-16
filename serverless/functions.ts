import { AWS } from '@serverless/typescript';

const functions: AWS['functions'] = {
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
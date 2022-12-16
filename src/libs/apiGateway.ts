// This function will take an object
export const formatJSONResponse = ({
    statusCode = 200,           // Default value 200
    data = {},                  // Default value empty object
    headers,
}: {
    // Defining the types of variables in an object
    // '?' means parameter is optional
    statusCode?: number,
    data?: any,
    headers?: Record<string, string>
}) => {
    return {
        statusCode,
        body: JSON.stringify({data}),
        headers: {
            "Access-Control-Allow-Origin": "*",                 // Allow all URLs to make request to this URL
            "Access-Control-Allow-Credentials": true,           // Allows cookies in the request, CORS doesnot allow it by default. Prevents CSRF
            ...headers
        }
    }
}
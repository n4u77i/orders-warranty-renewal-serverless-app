# Serverless - AWS Node.js Typescript

This project has been generated using the `aws-nodejs-typescript` template from the [Serverless framework](https://www.serverless.com/).

For detailed instructions, please refer to the [documentation](https://www.serverless.com/framework/docs/providers/aws/).

## About the project
This project is about creating orders and renewing them when expired. When the order is created by user, the warranty is added which will get expire after **two years** when order is created.

When the order is expired (TTL expires), it gets deleted (from dynamodb) and a notification is sent to the user to their email or phone numebr via **SES** or **SNS** respectively (lambda is triggered on REMOVE stream event).

At the same time, new record is added in dynamodb with same data except for a **TTL of 30-days**. Users will get a link in the notification to renew their order which will be valid for 30-days.

If order is renewed, it will then expire after next two years otherwise it will be deleted automatically from dynamodb permanently.

**Note:**
The services **SNS** and **SES** used in this project are configured to run in sandboxed environment to avoid charges.

## Installation/deployment instructions

Depending on your preferred package manager, follow the instructions below to deploy your project.

> **Requirements**: NodeJS `lts/fermium (v.14.15.0)`. If you're using [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to ensure you're using the same Node version in local and in your lambda's runtime.

### Using NPM

- Run `npm i` to install the project dependencies
- Run `npx sls deploy` to deploy this stack to AWS

### Using Yarn

- Run `yarn` to install the project dependencies
- Run `yarn sls deploy` to deploy this stack to AWS

### Using Serverless

- Run `sls deploy` to deploy this stack to AWS

## Testing the service

This template contain five lambda functions, four of them are triggered by an HTTP request made on the provisioned API Gateway REST API:
>-  `/` route with `POST` method which takes body input in JSON format.
>- `/user/{userId}` and `/order/{orderId}` routes with `GET` methods.
>- `/renew` route with `PUT` method to update specific order.
>-  And the last lambda function is triggered by the dynamodb stream on the `REMOVE` event when TTL of a record is expired.


The body structure is tested by API Gateway against the following:
1. `src/functions/createOrder/index.ts`
2. `src/functions/getOrder/index.ts`
3. `src/functions/getOrders/index.ts`
4. `src/functions/sendOrder/index.ts`
5. `src/functions/updateOrder/index.ts`

## Testing the endpoints

 - The `/` route with `POST` method requires data in the body in a **JSON** format. 
    - The required params are `companyName` and `carName` of type string and number respectively.
    - Third param can either be `phoneNumber` or `email` of string. Country code is required before number.
    ```
    {
        "phoneNumber": "+920000000000",
        "companyName": "Dodge",
        "carName": "Challenger SRT Hellcat"
    }
    ```
    **OR**
    ```
    {
        "email": "youremail@gmail.com",
        "companyName": "Dodge",
        "carName": "Challenger SRT Hellcat"
    }
    ```
- The `/user/{userId}` route with a `GET` method requires the `userId` which can be a `phoneNumber` or `email` entered when creating order. This route will be used to query all order of a user.
- The `/order/{orderId}` route with a `GET` method requires the `orderId` to get specific order.
- The `/renew` route with a `PUT` method requires `orderId` in query param of URL to update order. The exact route will be `/renew?orderId={orderId}`

**All endpoints are tested on Postman**

> :warning: As is, this template, once deployed, open **public** endpoints within your AWS account resources. Anybody with the URLs can actively execute the API Gateway endpoint and the corresponding lambda. You should protect these endpoints with the authentication method of your choice.

### Project structure

The project code base is mainly located within the `src` folder. This folder is divided in:

- `functions` - containing code base and configuration for your lambda functions
- `libs` - containing shared code base between your lambdas

```
.
├── src
│   ├── functions               # Lambda configuration and source code folder
│   │   ├── createOrder
│   │   │   └── index.ts        # Export of handler for createOrder lambda function
│   │   ├── getOrder
│   │   │   └── index.ts        # Export of handler for getOrder lambda function
│   │   ├── getOrders
│   │   │   └── index.ts        # Export of handler for getOrders lambda function
│   │   ├── sendOrder
│   │   │   └── index.ts        # Export of handler for sendOrder lambda function
│   │   └── updateOrder
│   │       └── index.ts        # Export of handler for updateOrder lambda function
│   └── libs                    
│       ├── apiGateway.ts       # API Gateway specific helper functions
|       └── dynamo.ts           # Methods for interacting with dynaomo db 
├── serverless
│   ├── functions.ts            # Handlers path for lambda functions
|   └── dynamoResources.ts      # To add aws dynamo db resource
├── package.json
├── serverless.ts               # Serverless service file
├── tsconfig.json               # Typescript compiler configuration
├── tsconfig.paths.json         # Typescript paths
└── webpack.config.js           # Webpack configuration
```
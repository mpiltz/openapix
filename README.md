<div align="center">
	<br/>
	<br/>
  <h1>
	<img height="140" src="assets/alma-cdk-openapix.svg" alt="Alma CDK OpenApiX" />
  <br/>
  <br/>
  </h1>

  ```sh
  npm i -D @alma-cdk/openapix
  ```

  <div align="left">

  Generate AWS Api Gateway REST APIs via [OpenAPI](https://www.openapis.org/) (a.k.a. Swagger) Schema Definitions by consuming "clean" OpenAPI schemas and inject `x-amazon-apigateway-` extensions _with type-safety_.

  </div>
  <br/>
</div>


<br/>

<div align="center">

![diagram](assets/diagram.svg)

</div>

<br/>

## Work in Progress

![experimental](https://img.shields.io/badge/stability-experimental-yellow "Stability: Experimental")

🚧 &nbsp;**Do not use for production critial stuff! This construct is still very much work in progress and breaking changes may occur.** 🚧


<br/>

## Getting Started

1. First, let's create some integration points:
    ```ts
    const fn = new lambda.Function(this, "fn", {
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromInline('export function handler() { return { statusCode: 200, body: JSON.stringify("hello")} }'),
    });

    const pkName = 'item';
    const table = new dynamodb.Table(this, 'table', {
      partitionKey: {
        type: dynamodb.AttributeType.STRING,
        name: pkName,
      }
    });

    const role = new iam.Role(this, "role", {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    table.grantReadData(role);
    ```


2. Next, let's inject the integrations into an existing OpenAPI schema:
    ```ts
    import * as openapix from '@alma-cdk/openapix';

    const apiDefinition = new openapix.OpenApiDefinition(this, {
      upload: false, // by default add as inline Body, set to true to use as BodyS3Location
      source: './schema.yaml',
      integrations: {

        // Mock Integration
        '/mock': {
          'GET': new openapix.MockIntegration(this),
        },

        // AWS Lambda integration
        '/message': {
          'POST': new openapix.LambdaIntegration(this, fn),
        },

        // HTTP Proxy integration
        '/ext': {
          'ANY': new openapix.HttpIntegration(this, "https://example.com"),
        },

        // Direct integration to AWS Service
        '/item': {
          'GET': new openapix.AwsIntegration(this, {
            service: 'dynamodb',
            action: 'GetItem',
            options: {
              credentialsRole: role,
              requestTemplates: {
                'application/json': JSON.stringify({
                  "TableName": table.tableName,
                  "Key": {
                    [pkName]: {
                      "S": "$input.params('item')"
                    }
                  }
                }),
              },
            },
          }),
        },

      },
    })
    ```

3. Finally, let's assign the definition into `SpecRestApi`:
    ```ts
    import { SpecRestApi } from 'aws-cdk-lib/aws-apigateway';

    new SpecRestApi(this, 'api', {
      apiDefinition,
      // optionally configure the API as you wish...
    });
    ```

<br/>

## Validators

```ts
const apiDefinition = new openapix.OpenApiDefinition(this, {
  source: './schema.yaml',

  validators: {
    'all': {
      validateRequestBody: true,
      validateRequestParameters: true,
      default: true, // set this as the "API level" default validator
    },
    'params-only' : {
      validateRequestBody: false,
      validateRequestParameters: true,
    },
  },

  integrations: {

    '/message': {
      // Set a method-specific validator
      'POST': new openapix.LambdaIntegration(this, fn, { validator: 'params-only' }),
    },

  },
})
```

<br/>

## Authorizers


<br/>

## Inject/Reject

You may modify the generated OpenAPI definition (which is used to define API Gateway REST API) by injecting or rejecting values from the source OpenAPI schema definition:
```ts
const apiDefinition = new openapix.OpenApiDefinition(this, {
  source: './schema.yaml',

  // Add any OpenAPI v3 data.
  // Can be useful for passing values from CDK code.
  // See https://swagger.io/specification/
  injections: {
    "info.title": "FancyPantsAPI"
  },

  // Reject fields by absolute object path from generated definition
  rejections: ['info.description'],

  // Reject all matching fields from generated definition
  rejectionsDeep: ['example', 'examples'],
});
```

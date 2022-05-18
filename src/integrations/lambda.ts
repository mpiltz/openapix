import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { generateLambdaXAmazonIntegration } from '../x-amazon-integration/lambda';
import { Integration } from './base';

export interface LambdaIntegrationOptions extends apigateway.LambdaIntegrationOptions {
  readonly validator?: string;
}

export class LambdaIntegration extends Integration {
  public readonly fn: lambda.IFunction;

  constructor(scope: Construct, fn: lambda.IFunction, props?: LambdaIntegrationOptions) {
    super();
    const integrationOptions = props || {};
    this.fn = fn;
    this.xAmazonApiGatewayRequestValidator = props?.validator;
    this.xAmazonIntegration = generateLambdaXAmazonIntegration(scope, fn, integrationOptions);
  }
}

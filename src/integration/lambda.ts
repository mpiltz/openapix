import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Integration, IntegrationConfig, InternalIntegrationType, ValidatorConfig } from './base';
import { LambdaInvocation } from '../lambda-invocation';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { IntegrationProps } from 'aws-cdk-lib/aws-apigateway';
import { IGrantable } from 'aws-cdk-lib/aws-iam';

export interface LambdaIntegrationOptions extends apigateway.LambdaIntegrationOptions, ValidatorConfig {}

/** Defines an AWS Lambda integration. */
export class LambdaIntegration extends Integration {

  private fn: IFunction;

  /**
   * Defines an AWS Lambda integration.
   *
   * @example
   * '/message': {
   *    'POST': new openapix.LambdaIntegration(this, fn),
   * },
   */
  constructor(scope: Construct, fn: IFunction, props?: LambdaIntegrationOptions) {

    const lambdaInvocation = new LambdaInvocation(scope, fn);

    const integration: IntegrationProps = {
      type: LambdaIntegration.selectIntegrationType(props?.proxy),
      uri: lambdaInvocation.uri,
      integrationHttpMethod: 'POST',
      options: props,
    };

    const config: IntegrationConfig = {
      type: InternalIntegrationType.LAMBDA,
      validator: props?.validator,
    };

    super(integration, config);

    this.fn = fn;
  }

  /** Allow Lambda invoke action to be performed by given identity. */
  public grantFunctionInvoke(identity: IGrantable): void {
    this.fn.grantInvoke(identity);
  }

  /**
   * Selects the Lambda integration type.
   *
   * @default
   * 'AWS_PROXY'
   */
  private static selectIntegrationType(proxy?: boolean): apigateway.IntegrationType {
    if (proxy === false) {
      return apigateway.IntegrationType.AWS;
    }

    // default to proxy as CDK does
    return apigateway.IntegrationType.AWS_PROXY;
  }

}

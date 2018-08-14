import {SwaggerMockValidatorOptionsMockType, SwaggerMockValidatorOptionsSpecType, ValidationResult} from '../api-types';

export interface PactBroker {
    _links: PactBrokerLinks;
}

interface PactBrokerLinks {
    'pb:latest-provider-pacts': PactBrokerLinksLatestProviderPacts;
}

interface PactBrokerLinksLatestProviderPacts {
    href: string;
}

export interface PactBrokerProviderPacts {
    _links: PactBrokerProviderPactsLinks;
}

interface PactBrokerProviderPactsLinks {
    pacts: PactBrokerProviderPactsLinksPact[];
}

export interface PactBrokerProviderPactsLinksPact {
    href: string;
}

export interface SwaggerMockValidatorUserOptions {
    analyticsUrl?: string;
    mockPathOrUrl: string;
    providerName?: string;
    specPathOrUrl: string;
}

export type AutoDetectFormat = 'auto-detect';

export interface SerializedSpec {
    content: string;
    format: SwaggerMockValidatorOptionsSpecType | AutoDetectFormat;
    pathOrUrl: string;
}

export interface SerializedMock {
    content: string;
    format: SwaggerMockValidatorOptionsMockType | AutoDetectFormat;
    pathOrUrl: string;
}

export interface ValidateOptions {
    mock: SerializedMock;
    spec: SerializedSpec;
}

interface ParsedSwaggerMockValidatorOptions {
    analyticsUrl?: string;
    mockPathOrUrl: string;
    mockSource: MockSource;
    providerName?: string;
    specPathOrUrl: string;
    specSource: SpecSource;
}

export type MockSource = 'pactBroker' | 'path' | 'url';

export type SpecSource = 'path' | 'url';

export interface GetSwaggerValueSuccessResult<T> {
    found: true;
    results: ValidationResult[];
    value: T;
}

export interface GetSwaggerValueFailedResult {
    found: false;
    results: ValidationResult[];
}

export type GetSwaggerValueResult<T> = GetSwaggerValueSuccessResult<T> | GetSwaggerValueFailedResult;

export type MultiCollectionFormatSeparator = '[multi-array-separator]';

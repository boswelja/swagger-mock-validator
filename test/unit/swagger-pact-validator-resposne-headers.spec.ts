import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as _ from 'lodash';
import customJasmineMatchers from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    responseBuilder,
    ResponseBuilder,
    responseHeaderBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator response headers', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    const validateResponseHeaders = (
        swaggerResponseBuilder: ResponseBuilder,
        pactResponseHeaders: {[name: string]: string}
    ) => {
        let interaction = defaultInteractionBuilder;

        _.each(pactResponseHeaders, (headerValue, headerName) => {
            interaction = interaction.withResponseHeader(headerName, headerValue);
        });

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const response = swaggerResponseBuilder || responseBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder.withResponse(200, response)))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact response header matches the spec', willResolve(() => {
        const pactResponseHeaders = {'x-custom-header': '1'};
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderBuilder.withTypeNumber());

        return validateResponseHeaders(responseSpec, pactResponseHeaders).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when the pact response header does not match the spec', willResolve(() => {
        const pactResponseHeaders = {'x-custom-header': 'not-a-number'};
        const responseHeaderSpec = responseHeaderBuilder.withTypeNumber();
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderSpec);

        const result = validateResponseHeaders(responseSpec, pactResponseHeaders);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                    value: 'not-a-number'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-custom-header',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: responseHeaderSpec.build()
                },
                type: 'error'
            }]);
        });
    }));

    it('should return a warning when the spec uses the array type', willResolve(() => {
        const pactResponseHeaders = {'x-custom-header': '1,2,3'};
        const responseHeaderSpec = responseHeaderBuilder.withTypeArrayOfNumber();
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderSpec);

        return validateResponseHeaders(responseSpec, pactResponseHeaders).then((result) => {
            (expect(result) as any).toContainWarnings([{
                message:
                    'Validating parameters of type "array" are not supported, assuming value is valid: x-custom-header',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                    value: '1,2,3'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-custom-header',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: responseHeaderSpec.build()
                },
                type: 'warning'
            }]);
        });
    }));

    it('should pass when the pact response header is missing and the spec defines it', willResolve(() => {
        const responseSpec = responseBuilder.withHeader('x-custom-header', responseHeaderBuilder.withTypeNumber());

        return validateResponseHeaders(responseSpec, null).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should fail when a pact response header is defined that is not in the spec', willResolve(() => {
        const requestHeaders = {'x-custom-header': 'value'};

        const result = validateResponseHeaders(null, requestHeaders);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Response header is not defined in the swagger file: x-custom-header',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                    value: 'value'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: responseBuilder.build()
                },
                type: 'error'
            }]);
        });
    }));

    it('should warn when pact response headers not defined in the spec are standard http headers', willResolve(() => {
        const pactResponseHeaders = {
            'Accept-Patch': 'text/example;charset=utf-8',
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Age': '12',
            'Allow': 'GET, HEAD',
            'Alt-Svc': 'h2="http2.example.com:443"; ma=7200',
            'Cache-Control': 'max-age=3600',
            'Connection': 'close',
            'Content-Disposition': 'attachment; filename="fname.ext"',
            'Content-Encoding': 'gzip',
            'Content-Language': 'da',
            'Content-Length': '348',
            'Content-Location': '/index.htm',
            'Content-MD5': 'Q2hlY2sgSW50ZWdyaXR5IQ==',
            'Content-Range': 'bytes 21010-47021/47022',
            'Date': 'Tue, 15 Nov 1994 08:12:31 GMT',
            'ETag': '"737060cd8c284d8af7ad3082f209582d"',
            'Expires': 'Thu, 01 Dec 1994 16:00:00 GMT',
            'Last-Modified': 'Tue, 15 Nov 1994 12:45:26 GMT',
            'Link': '</feed>; rel="alternate"[36]',
            'Location': 'http://www.w3.org/pub/WWW/People.html',
            'P3P': 'CP="This is not a P3P policy!"',
            'Pragma': 'no-cache',
            'Proxy-Authenticate': 'Basic',
            'Public-Key-Pins': 'max-age=2592000; pin-sha256="E9CZ9INDbd+2eRQozYqqbQ2yXLVKB9+xcprMF+44U1g=";',
            'Refresh': '5; url=http://www.w3.org/pub/WWW/People.html',
            'Retry-After': '120',
            'Server': 'Apache/2.4.1 (Unix)',
            'Set-Cookie': 'UserID=JohnDoe; Max-Age=3600; Version=1',
            'Status': '200 OK',
            'Strict-Transport-Security': 'max-age=16070400; includeSubDomains',
            'TSV': '?',
            'Trailer': 'Max-Forwards',
            'Transfer-Encoding': 'chunked',
            'Upgrade': 'HTTP/2.0, HTTPS/1.3, IRC/6.9, RTA/x11, websocket',
            'Vary': '*',
            'Via': '1.0 fred, 1.1 example.com (Apache/1.1)',
            'WWW-Authenticate': 'Basic',
            'Warning': '199 Miscellaneous warning',
            'X-Frame-Options': 'deny'
        };

        return validateResponseHeaders(null, pactResponseHeaders).then((result) => {
            const warnings = _.map(pactResponseHeaders, (headerValue: string, headerName: string) => ({
                message:
                    `Standard http response header is not defined in the swagger file: ${headerName.toLowerCase()}`,
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: `[pactRoot].interactions[0].response.headers.${headerName}`,
                    value: headerValue
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: responseBuilder.build()
                },
                type: 'warning'
            }));

            (expect(result) as any).toContainWarnings(warnings);
        });
    }));

    it('should pass when pact mocks out the content type header', willResolve(() => {
        const requestHeaders = {'Content-Type': 'application/json'};

        return validateResponseHeaders(null, requestHeaders).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should not be case sensitive when comparing mock and spec response headers', willResolve(() => {
        const pactResponseHeaders = {'content-Type': 'application/json', 'X-Custom-Header': '1'};
        const responseSpec = responseBuilder.withHeader('X-custom-header', responseHeaderBuilder.withTypeNumber());

        return validateResponseHeaders(responseSpec, pactResponseHeaders).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should validate headers of default responses in the spec', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(defaultInteractionBuilder
                .withResponseStatus(201)
                .withResponseHeader('x-custom-header', 'not-a-number'))
            .build();

        const responseHeader = responseHeaderBuilder.withTypeNumber();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withDefaultResponse(responseBuilder.withHeader('x-custom-header', responseHeader))
                )
            )
            .build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                    value: 'not-a-number'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.default.headers.x-custom-header',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: responseHeader.build()
                },
                type: 'error'
            }]);
        });
    }));
});

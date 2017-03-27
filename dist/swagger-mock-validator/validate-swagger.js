"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const q = require("q");
const SwaggerTools = require("swagger-tools");
const validate = (document) => {
    const deferred = q.defer();
    SwaggerTools.specs.v2.validate(document, (error, result) => {
        if (error) {
            deferred.reject(error);
        }
        else {
            deferred.resolve(result);
        }
    });
    return deferred.promise;
};
const generateLocation = (path) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }
    return '[swaggerRoot]';
};
const generateResult = (options) => ({
    code: options.code,
    message: options.message,
    mockDetails: {
        interactionDescription: null,
        interactionState: null,
        location: '[pactRoot]',
        mockFile: options.mockPathOrUrl,
        value: null
    },
    source: 'swagger-validation',
    specDetails: {
        location: options.specLocation,
        pathMethod: null,
        pathName: null,
        specFile: options.specPathOrUrl,
        value: null
    },
    type: options.type
});
const parseValidationResult = (validationResult, specPathOrUrl, mockPathOrUrl) => {
    const validationErrors = _.get(validationResult, 'errors', [])
        .map((swaggerValidationError) => generateResult({
        code: 'sv.error',
        message: swaggerValidationError.message,
        mockPathOrUrl,
        specPathOrUrl,
        specLocation: generateLocation(swaggerValidationError.path),
        type: 'error'
    }));
    const validationWarnings = _.get(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) => generateResult({
        code: 'sv.warning',
        message: swaggerValidationWarning.message,
        mockPathOrUrl,
        specPathOrUrl,
        specLocation: generateLocation(swaggerValidationWarning.path),
        type: 'warning'
    }));
    if (validationErrors.length > 0) {
        const error = new Error(`"${specPathOrUrl}" is not a valid swagger file`);
        error.details = {
            errors: validationErrors,
            warnings: validationWarnings
        };
        return q.reject(error);
    }
    return q({ warnings: validationWarnings });
};
exports.default = (specJson, specPathOrUrl, mockPathOrUrl) => validate(specJson)
    .then((validationResult) => parseValidationResult(validationResult, specPathOrUrl, mockPathOrUrl));
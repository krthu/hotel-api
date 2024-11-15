const createSuccessResponse = (data, headers = {}) => {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data),
    };
};

const createErrorResponse = (message, statusCode = 500, headers = {}) => {
    return {
        statusCode: statusCode,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ error: message }),
    };
};

module.exports = {
    createSuccessResponse,
    createErrorResponse
};

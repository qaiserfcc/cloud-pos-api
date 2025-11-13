const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinitionPath = path.join(__dirname, '../../src/swagger/swagger-definition.json');
const swaggerBaseDefinition = JSON.parse(fs.readFileSync(swaggerDefinitionPath, 'utf8'));

const swaggerDefinition = {
  ...swaggerBaseDefinition,
  servers: (swaggerBaseDefinition.servers || []).map((server, index) => {
    if (index === 0) {
      return {
        ...server,
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
      };
    }
    return server;
  }),
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/controllers/*.ts',
    './src/routes/*.ts',
    './src/db/models/*.ts',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

// Function to convert OpenAPI spec to Postman collection
function convertSwaggerToPostman(swaggerSpec) {
  const collection = {
    info: {
      name: swaggerSpec.info.title,
      description: swaggerSpec.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      {
        key: 'baseUrl',
        value: swaggerSpec.servers[0].url,
        type: 'string',
      },
      {
        key: 'authToken',
        value: '',
        type: 'string',
      },
    ],
    item: [],
  };

  // Convert paths to Postman requests
  Object.entries(swaggerSpec.paths).forEach(([apiPath, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      // Normalize path to avoid duplicating base '/api/v1' when baseUrl already includes it
      const normalizedPath = apiPath.replace(/^\/api\/v1(?![a-zA-Z0-9_\-])/u, '');
      const pathSegments = normalizedPath.split('/').filter(p => p);
      const request = {
        name: operation.summary || `${method.toUpperCase()} ${apiPath}`,
        request: {
          method: method.toUpperCase(),
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
            {
              key: 'Authorization',
              value: 'Bearer {{authToken}}',
            },
          ],
          url: {
            raw: `{{baseUrl}}${normalizedPath}`,
            host: ['{{baseUrl}}'],
            path: pathSegments,
          },
        },
        response: [],
      };

      // Add query parameters if any
      if (operation.parameters) {
        const queryParams = operation.parameters.filter(p => p.in === 'query');
        if (queryParams.length > 0) {
          request.request.url.query = queryParams.map(param => ({
            key: param.name,
            value: param.schema?.example || '',
            description: param.description,
          }));
        }
      }

      // Add path parameters if any
      if (operation.parameters) {
        const pathParams = operation.parameters.filter(p => p.in === 'path');
        if (pathParams.length > 0) {
          request.request.url.variable = pathParams.map(param => ({
            key: param.name,
            value: param.schema?.example || '',
            description: param.description,
          }));
        }
      }

      // Add request body if any
      if (operation.requestBody) {
        const content = operation.requestBody.content;
        if (content && content['application/json']) {
          const schema = content['application/json'].schema;
          if (schema && schema.properties) {
            const exampleBody = {};
            Object.entries(schema.properties).forEach(([key, prop]) => {
              if (prop.example !== undefined) {
                exampleBody[key] = prop.example;
              } else if (prop.type === 'string') {
                exampleBody[key] = 'example';
              } else if (prop.type === 'number') {
                exampleBody[key] = 1;
              } else if (prop.type === 'boolean') {
                exampleBody[key] = true;
              } else if (prop.type === 'array') {
                exampleBody[key] = [];
              } else {
                exampleBody[key] = null;
              }
            });
            request.request.body = {
              mode: 'raw',
              raw: JSON.stringify(exampleBody, null, 2),
            };
          }
        }
      }

      collection.item.push(request);
    });
  });

  return collection;
}

// Generate Postman collection
const postmanCollection = convertSwaggerToPostman(swaggerSpec);

// Write to file
const outputPath = path.join(__dirname, 'cloud-pos-api.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2));

console.log(`Postman collection generated successfully: ${outputPath}`);
console.log(`Collection contains ${postmanCollection.item.length} requests`);
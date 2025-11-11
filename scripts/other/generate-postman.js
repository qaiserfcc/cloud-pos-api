const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Cloud POS API',
    version: '1.0.0',
    description: 'Multi-tenant Point-of-Sale API with offline synchronization',
    contact: {
      name: 'API Support',
      email: 'support@cloudpos.com',
    },
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      Sale: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          saleNumber: {
            type: 'string',
            example: 'SALE-2024-001',
          },
          tenantId: {
            type: 'string',
            format: 'uuid',
          },
          storeId: {
            type: 'string',
            format: 'uuid',
          },
          customerId: {
            type: 'string',
            format: 'uuid',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled'],
          },
          paymentStatus: {
            type: 'string',
            enum: ['pending', 'partial', 'paid', 'refunded'],
          },
          subtotal: {
            type: 'number',
            example: 100.00,
          },
          taxAmount: {
            type: 'number',
            example: 10.00,
          },
          discountAmount: {
            type: 'number',
            example: 5.00,
          },
          totalAmount: {
            type: 'number',
            example: 105.00,
          },
          paidAmount: {
            type: 'number',
            example: 105.00,
          },
          changeAmount: {
            type: 'number',
            example: 0.00,
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                  format: 'uuid',
                },
                productName: {
                  type: 'string',
                },
                quantity: {
                  type: 'number',
                },
                unitPrice: {
                  type: 'number',
                },
                discount: {
                  type: 'number',
                },
                total: {
                  type: 'number',
                },
              },
            },
          },
          payments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number',
                },
                method: {
                  type: 'string',
                  enum: ['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'],
                },
                reference: {
                  type: 'string',
                },
                processedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};

const options = {
  swaggerDefinition,
  apis: [
    './src/controllers/*.ts',
    './src/routes/*.ts',
    './src/models/*.ts',
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
  Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const request = {
        name: operation.summary || `${method.toUpperCase()} ${path}`,
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
            raw: `{{baseUrl}}${path}`,
            host: ['{{baseUrl}}'],
            path: path.split('/').filter(p => p),
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
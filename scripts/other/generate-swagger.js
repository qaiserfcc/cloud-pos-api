const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const swaggerDefinitionPath = path.join(__dirname, '../../src/swagger/swagger-definition.json');
const swaggerBaseDefinition = JSON.parse(fs.readFileSync(swaggerDefinitionPath, 'utf8'));

const mergedSwaggerDefinition = {
  ...swaggerBaseDefinition,
  servers: (swaggerBaseDefinition.servers || []).map((server, index) => {
    if (index === 0) {
      return {
        ...server,
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1'
      };
    }
    return server;
  })
};

const options = {
  definition: mergedSwaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/db/models/*.ts'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

// Write the swagger spec to a file
fs.writeFileSync(path.join(__dirname, 'swagger.json'), JSON.stringify(swaggerSpec, null, 2));

console.log('Swagger documentation generated successfully!');
console.log('File saved to: swagger.json');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Sistema de Apoio à Avaliação Psicopedagógica',
      version: '1.0.0',
      description:
        'API REST para gerenciamento de avaliações psicopedagógicas, aprendentes e relatórios.',
      contact: {
        name: 'Suporte',
        email: 'suporte@psicopedagogia.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Servidor de Desenvolvimento',
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
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.js', './src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

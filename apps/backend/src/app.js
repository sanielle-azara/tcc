const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { requestContext } = require('./audit/context');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const aprendentesRoutes = require('./modules/aprendentes/aprendentes.routes');
const avaliacoesRoutes = require('./modules/avaliacoes/avaliacoes.routes');
const aplicacoesRoutes = require('./modules/aplicacoes/aplicacoes.routes');
const relatoriosRoutes = require('./modules/relatorios/relatorios.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const auditoriaRoutes = require('./modules/auditoria/auditoria.routes');

const app = express();

// Atrás de um proxy reverso (Nginx), define quantos saltos são confiáveis para obter o IP real
if (config.trustProxy) app.set('trust proxy', config.trustProxy);

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Contexto da requisição usado pela auditoria; registrado depois da leitura do corpo
// para que o contexto se propague pelo restante do processamento
app.use(requestContext);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/aprendentes', aprendentesRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/aplicacoes', aplicacoesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

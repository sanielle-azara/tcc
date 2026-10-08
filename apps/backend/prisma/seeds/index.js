const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting database seed...');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@psicopedagogia.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@psicopedagogia.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const profPassword = await bcrypt.hash('Prof@123', 12);
  const profissional = await prisma.user.upsert({
    where: { email: 'profissional@psicopedagogia.com' },
    update: {},
    create: {
      name: 'Ana Lima',
      email: 'profissional@psicopedagogia.com',
      passwordHash: profPassword,
      role: 'PSICOPEDAGOGO',
      status: 'ACTIVE',
    },
  });

  const aprendente1 = await prisma.aprendente.upsert({
    where: { id: 'seed-aprendente-001' },
    update: {},
    create: {
      id: 'seed-aprendente-001',
      name: 'João Pedro Silva',
      birthDate: new Date('2015-03-12'),
      sexo: 'MASCULINO',
      responsavelNome: 'Maria Silva',
      responsavelRelacao: 'Mãe',
      contatoPrincipal: '(31) 99999-0001',
      email: 'maria.silva@email.com',
      escolaNome: 'E.E. João XXIII',
      escolaSerie: '4º ano',
      escolaTurno: 'Manhã',
      observacoes: 'Apresenta dificuldades em leitura e escrita.',
      responsavelId: profissional.id,
    },
  });

  const avaliacao1 = await prisma.avaliacao.upsert({
    where: { id: 'seed-avaliacao-001' },
    update: {},
    create: {
      id: 'seed-avaliacao-001',
      name: 'Avaliação de Leitura e Escrita',
      description: 'Avaliação inicial das habilidades de leitura e escrita.',
      category: 'Linguagem',
      version: 1,
      status: 'ACTIVE',
      autorId: profissional.id,
      questions: {
        create: [
          {
            text: 'Como você descreveria as dificuldades de leitura do aprendente?',
            type: 'LONG_TEXT',
            required: true,
            order: 1,
          },
          {
            text: 'Qual é o nível atual de leitura? (1 = Muito abaixo, 5 = Na média)',
            type: 'SCALE',
            required: true,
            order: 2,
            scaleMin: 1,
            scaleMax: 5,
            scaleMinLabel: 'Muito abaixo do esperado',
            scaleMaxLabel: 'Na média esperada',
          },
          {
            text: 'O aprendente consegue ler textos simples?',
            type: 'YES_NO',
            required: true,
            order: 3,
          },
          {
            text: 'Quais dificuldades específicas foram observadas?',
            type: 'MULTI_SELECT',
            required: false,
            order: 4,
            options: JSON.stringify([
              'Inversão de letras',
              'Omissão de letras',
              'Troca de fonemas',
              'Dificuldade de decodificação',
              'Leitura silabada',
            ]),
          },
          {
            text: 'Data da última avaliação escolar',
            type: 'DATE',
            required: false,
            order: 5,
          },
          {
            text: 'Observações adicionais',
            type: 'LONG_TEXT',
            required: false,
            order: 6,
          },
        ],
      },
    },
  });

  const avaliacao2 = await prisma.avaliacao.upsert({
    where: { id: 'seed-avaliacao-002' },
    update: {},
    create: {
      id: 'seed-avaliacao-002',
      name: 'Avaliação Psicomotora',
      description: 'Avaliação das habilidades psicomotoras do aprendente.',
      category: 'Psicomotricidade',
      version: 1,
      status: 'ACTIVE',
      autorId: profissional.id,
      questions: {
        create: [
          {
            text: 'Descreva as habilidades motoras finas observadas',
            type: 'LONG_TEXT',
            required: true,
            order: 1,
          },
          {
            text: 'Como é a coordenação motora grossa?',
            type: 'SINGLE_SELECT',
            required: true,
            order: 2,
            options: JSON.stringify(['Excelente', 'Boa', 'Regular', 'Abaixo do esperado']),
          },
          {
            text: 'O aprendente apresenta lateralidade definida?',
            type: 'YES_NO',
            required: true,
            order: 3,
          },
          {
            text: 'Nota geral de desenvolvimento psicomotor (1-10)',
            type: 'NUMERIC',
            required: true,
            order: 4,
          },
        ],
      },
    },
  });

  console.info('✅ Seed completed!');
  console.info(`👤 Admin: admin@psicopedagogia.com / Admin@123`);
  console.info(`👤 Profissional: profissional@psicopedagogia.com / Prof@123`);
  console.info(`📚 Aprendente: ${aprendente1.name}`);
  console.info(`📋 Avaliações: ${avaliacao1.name}, ${avaliacao2.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# Roteiro de fala — Defesa do TCC (25/11/2026)

Tempo total previsto: cerca de 19 minutos. O tempo ao lado de cada slide é uma referência; o acumulado ajuda a saber se está adiantada ou atrasada.

---

## 1. Capa (0:20 — acumulado 0:20)

Boa tarde a todos. Meu nome é Sanielle Gonçalves Azara e vou apresentar meu Trabalho de Conclusão de Curso, intitulado "Desenvolvimento de um Sistema Web de Apoio à Avaliação Psicopedagógica na Educação Infantil", orientado pela professora Fernanda Rodrigues Macedo.

## 2. Sumário (0:15 — 0:35)

A apresentação segue a estrutura do trabalho: introdução, estudos relacionados, fundamentação teórica, materiais e métodos, desenvolvimento do sistema, resultados e, por fim, a conclusão.

---

## 3. Contextualização (0:50 — 1:25)

A avaliação psicopedagógica é um dos principais instrumentos de trabalho do psicopedagogo. Ela procura entender como fatores cognitivos, emocionais, sociais e do contexto interferem na aprendizagem da criança. Não se resume a aplicar testes: o profissional articula instrumentos, observações e a história do aprendente, e acompanha essa criança ao longo do tempo.

O problema é que, na prática, esses registros ainda ficam em papel, planilhas e documentos espalhados. Isso dificulta a padronização, a rastreabilidade e o acompanhamento da evolução da criança. Além disso, os profissionais costumam adaptar os protocolos para cada criança, mas não têm uma forma organizada de registrar essas adaptações.

## 4. Justificativa (0:50 — 2:15)

Existem sim sistemas de prontuário eletrônico no mercado voltados a psicopedagogos e psicólogos. Mas eles priorizam a gestão do consultório, como agenda, financeiro e emissão de documentos. Em relação aos instrumentos de avaliação, oferecem no máximo um conjunto fixo ou formulários genéricos.

Nenhum deles informa permitir que o profissional cadastre e adapte os próprios instrumentos, com um controle de versões que preserve qual versão foi usada em cada aplicação. E como as conclusões psicopedagógicas são interpretativas, o profissional precisa de uma ferramenta que una dados estruturados com espaço para relatórios escritos livremente.

## 5. Objetivo Geral (0:30 — 2:45)

Assim, o objetivo geral do trabalho foi desenvolver um sistema web multiusuário de apoio à avaliação psicopedagógica na Educação Infantil, que permita registrar de forma estruturada as informações dos aprendentes, gerenciar os instrumentos avaliativos e acompanhar as etapas da avaliação, contribuindo para a padronização, a rastreabilidade e a qualidade das devolutivas.

## 6. Objetivos Específicos (0:40 — 3:25)

Para isso, foram definidos seis objetivos específicos: identificar os instrumentos e procedimentos da avaliação psicopedagógica infantil; projetar a arquitetura do sistema; implementar mecanismos de proteção das informações e analisar a adequação à LGPD; desenvolver uma interface pensada para usabilidade e acessibilidade; avaliar o sistema com profissionais da psicopedagogia; e, por fim, discutir as contribuições e limitações em relação aos trabalhos relacionados. Ao final, vou retomar cada um deles.

---

## 7. Estudos Relacionados (1:00 — 4:25)

As buscas foram feitas na SciELO, no PePSIC e na BDTD, considerando trabalhos de 2013 a 2025. Organizei os estudos em algumas linhas.

Nos prontuários eletrônicos, o Sistema PSI registra sessões de psicólogos, mas não estrutura a aplicação de instrumentos. O trabalho mais próximo do meu é a dissertação de Valgas, de 2021, que também usou Design Science Research, mas voltada à neuropsicologia de adultos em hospital.

Na triagem digital do desenvolvimento infantil, ferramentas como o TEDI e o ASQ-3 aplicado pela web funcionam bem, mas digitalizam instrumentos fixos, sem permitir que o profissional crie ou adapte os seus.

Sobre software na avaliação psicopedagógica, encontrei apenas o trabalho de Pinheiro, de 2013, que usa um software de avaliação e, curiosamente, aponta a falta de registro em prontuário.

Por fim, duas revisões em saúde mental trouxeram orientações importantes: envolver os usuários no projeto e equilibrar campos estruturados com registro narrativo.

## 8. Soluções Existentes no Mercado (0:45 — 5:10)

Também fiz um levantamento das soluções comerciais, com base no que cada fornecedor divulga no seu site. O iPsy Pro declara que não substitui os instrumentos de avaliação. O Cerebraris tem um conjunto predefinido de instrumentos. O PsicoManager oferece escalas, e o Ninsaúde permite criar modelos de formulário.

Mas, como mostra a última coluna, nenhum informa vincular a versão do instrumento a cada aplicação. É exatamente aí que o sistema proposto se diferencia. Vale destacar que o sistema não tem agenda nem financeiro, porque isso já é bem atendido pelo mercado e não fazia parte do escopo.

## 9. Delimitação da Lacuna (0:40 — 5:50)

Com isso, a lacuna ficou delimitada: nenhum estudo ou produto analisado reúne, no contexto da avaliação psicopedagógica infantil, o cadastro de instrumentos pelo próprio profissional, o versionamento que preserva a versão usada em cada aplicação, o registro das respostas e relatórios qualitativos ligados à aplicação.

E a literatura deixou duas orientações que segui no projeto: a participação dos profissionais, por meio da entrevista e do questionário, e o equilíbrio entre respostas estruturadas e relatórios em texto livre.

---

## 10. Fundamentação Teórica (0:50 — 6:40)

A fundamentação teve dois eixos. Do lado da psicopedagogia, estudei o desenvolvimento infantil de zero a seis anos e as etapas da avaliação: entrevista inicial, anamnese, observação, incluindo a EOCA, aplicação de instrumentos, análise, devolutiva e acompanhamento. Também analisei instrumentos como o Portage, o IDADI, o Denver II e o PRELEC. Um ponto importante da literatura é que, quando um instrumento é adaptado, essa adaptação precisa ser registrada.

Do lado da engenharia de software, os fundamentos que orientaram as decisões técnicas foram engenharia de requisitos e UML, arquitetura em camadas e REST, banco de dados relacional com mapeamento objeto-relacional, autenticação com JWT e controle de acesso por papéis, além de testes de software e das diretrizes de acessibilidade WCAG.

---

## 11. Classificação da Pesquisa (0:45 — 7:25)

Trata-se de uma pesquisa aplicada, conduzida segundo a Design Science Research, que é uma abordagem voltada a projetar, construir e avaliar artefatos que resolvem problemas reais de um campo profissional.

A tabela mostra como cada etapa da DSR aparece no trabalho: a identificação do problema veio da revisão, do levantamento de mercado e da entrevista; o projeto definiu requisitos, arquitetura e modelo de dados; o desenvolvimento foi incremental e iterativo; a avaliação envolveu testes, acessibilidade e questionário; e a comunicação corresponde à discussão, limitações e trabalhos futuros.

## 12. Coleta de Dados (0:45 — 8:10)

Além da revisão bibliográfica e da análise documental dos instrumentos, sem reproduzir o conteúdo deles, fiz uma entrevista semiestruturada com uma psicopedagoga em março de 2026, com termo de consentimento.

Ela relatou que usa planilhas e documentos sem integração, que tem dificuldade de manter o histórico das crianças, que adapta protocolos sem registrar as versões e que precisa de relatórios flexíveis. Também reforçou que os dados de cada criança devem ficar restritos ao profissional responsável. Essas falas orientaram diretamente vários requisitos. Todo o ambiente de demonstração usou apenas dados fictícios.

## 13. Ferramentas e Tecnologias (0:35 — 8:45)

No frontend, usei React com Vite e Material UI. No backend, Node.js com Express, em uma API REST, com JWT para autenticação e bcrypt para as senhas. A validação dos dados é feita com Zod, com os mesmos esquemas no frontend e no backend. Os dados ficam em MySQL, acessado pelo Prisma. Para testes, usei Vitest, Supertest, React Testing Library, e axe-core com Playwright para acessibilidade. E tudo roda em contêineres Docker, com Nginx.

---

## 14. Requisitos (0:45 — 9:30)

Foram definidos quinze requisitos funcionais, que cobrem o cadastro de aprendentes, o cadastro, o versionamento e a aplicação de instrumentos, o histórico, os relatórios em PDF e a restrição de visibilidade ao profissional responsável.

E onze requisitos não funcionais, focados em segurança, privacidade e qualidade. Três deles receberam metas mensuráveis: média de usabilidade igual ou maior que quatro, cobertura de testes de pelo menos setenta por cento no backend, e nenhuma violação de acessibilidade detectável pelo axe-core.

## 15. Arquitetura do Sistema (0:45 — 10:15)

O sistema segue uma arquitetura em três camadas: apresentação, aplicação e persistência. Toda requisição passa por autenticação, autorização e validação antes de chegar aos módulos de negócio, então o controle de acesso não depende do que a interface mostra.

O backend tem oito módulos independentes: autenticação, usuários, aprendentes, instrumentos, aplicações, relatórios, painel e auditoria. O banco tem onze tabelas. Na figura, os módulos em destaque são os que guardam dados clínicos e são exclusivos do psicopedagogo.

## 16. Segurança e Controle de Acesso (1:00 — 11:15)

A segurança tem algumas camadas. A primeira é o controle por perfil: existem dois, administrador e psicopedagogo. A segunda é a titularidade: cada psicopedagogo só vê os próprios aprendentes e instrumentos, e as aplicações e relatórios herdam a titularidade da criança.

Uma decisão importante foi separar a administração do acesso aos dados clínicos. Na primeira versão, o administrador via tudo. Mas o Código de Ética do Psicopedagogo diz que os registros de atendimento são sigilosos e restritos ao profissional responsável. Então o administrador passou a gerenciar contas sem ver avaliações nem relatórios. Para não perder a continuidade, caso um profissional saia, o administrador pode transferir os aprendentes para outro psicopedagogo.

Além disso, existe auditoria das criações, alterações, exclusões e consultas, e o sistema usa JWT com renovação, senhas com bcrypt e limitação de requisições.

## 17. Versionamento dos Instrumentos (1:00 — 12:15)

Este é o ponto central do trabalho. Enquanto o instrumento ainda não foi aplicado, as edições são salvas nele mesmo. Mas, quando o profissional altera as questões de um instrumento que já tem aplicações, o sistema avisa e, ao confirmar, arquiva a versão atual e cria uma nova.

No diagrama: as aplicações 1 e 2 continuam ligadas à versão 1, que foi arquivada, e as novas aplicações usam a versão 2. Assim, o histórico da criança nunca muda retroativamente, e o relatório sempre mostra a versão que foi realmente aplicada. Isso permite comparar avaliações feitas em momentos diferentes sabendo exatamente quais questões foram respondidas em cada uma.

## 18. Telas: Painel e Editor de Instrumentos (0:40 — 12:55)

À esquerda está o painel inicial, que dá ao psicopedagogo uma visão geral dos seus aprendentes e aplicações. À direita, o editor de instrumentos, onde o profissional cadastra as questões. Cada questão tem texto, tipo de resposta, obrigatoriedade e ordem. São oito tipos de resposta, como texto, número, data, seleção única ou múltipla, escala e sim ou não, o que permite montar diferentes protocolos sem mudar o banco de dados.

## 19. Telas: Aplicação e Relatório (0:40 — 13:35)

Aqui está o preenchimento de uma aplicação. O formulário é montado automaticamente a partir das questões do instrumento, e o profissional pode salvar e retomar depois. Ao finalizar, o sistema confere as questões obrigatórias e bloqueia as respostas.

À direita, o relatório impresso em PDF. Ele traz os dados do aprendente, o instrumento com sua versão, as respostas e a conclusão escrita pelo profissional, com espaço para assinatura. O sistema não gera diagnósticos: a interpretação continua sendo do profissional.

---

## 20. Atendimento aos Requisitos (0:45 — 14:20)

Dos quinze requisitos funcionais, treze foram atendidos plenamente e dois parcialmente. O RF09, porque as adaptações são versionadas, mas não há campo para o profissional justificar cada uma. E o RF12, porque as aplicações e relatórios ainda não aparecem na página do aprendente.

Dos onze requisitos não funcionais, dez foram atendidos e um parcialmente: o RNF03, já que o sistema ainda não tem criptografia em repouso nem política de retenção dos dados.

## 21. Testes e Acessibilidade (0:50 — 15:10)

Foram 147 testes automatizados, 88 no backend e 59 no frontend, todos aprovados. A cobertura do backend chegou a 83,06 por cento, acima da meta de setenta. O fluxo completo, do cadastro ao relatório, também foi verificado no ambiente Docker.

Na acessibilidade, o axe-core avaliou 18 telas nos critérios A e AA das WCAG 2.2. Encontrou cinco tipos de violação, dois críticos, como um botão sem nome para leitores de tela e campos de resposta sem rótulo. Todos foram corrigidos e a nova verificação não encontrou violações. Mas é importante dizer que a verificação foi só automatizada, então não posso afirmar conformidade plena.

## 22. Avaliação com Profissionais (1:00 — 16:10)

Cinco psicopedagogas usaram o sistema livremente por cerca de trinta minutos e responderam a um questionário anônimo, com notas de um a cinco.

A média geral foi 4,43, e 94 por cento das respostas foram notas quatro ou cinco, sem nenhuma nota um ou dois. O aspecto mais bem avaliado foi o cadastro de aprendentes, com 4,8. Facilidade de uso, organização e contribuição geral tiveram 4,6, o que atende à meta de usabilidade. A menor média foi a geração de relatórios, com 3,8, ainda acima do ponto neutro, mas indicando que precisa melhorar. Como a amostra é pequena, esses resultados são indicativos.

## 23. Discussão (1:00 — 17:10)

A menor nota em relatórios bate com as sugestões das participantes: elas pediram seções para hipótese diagnóstica e encaminhamentos, possibilidade de anexar laudos e uma linha do tempo do aprendente. Ou seja, o interesse delas vai além do registro das aplicações e chega ao acompanhamento longitudinal.

Comparando com os estudos: o trabalho de Valgas também usou DSR e teve boa usabilidade, mas fazia pontuação automática dos testes, que meu sistema ainda não faz. Já o TEDI e o ASQ-3 oferecem instrumentos validados fixos, enquanto aqui o profissional cadastra e adapta os seus com histórico de versões. E a combinação de respostas estruturadas com relatório em texto livre responde à tensão apontada por Kariotis.

---

## 24. Conclusão (0:45 — 17:55)

Concluo que o objetivo geral foi alcançado: o sistema funciona e cobre o fluxo completo, do cadastro do aprendente ao relatório. Os seis objetivos específicos foram atendidos, alguns com ressalvas, principalmente na LGPD e na acessibilidade.

A principal contribuição é tratar o instrumento avaliativo como elemento central, com cadastro pelo próprio profissional e versionamento ligado às aplicações, combinação que não encontrei nos estudos nem nos produtos analisados. O sistema foi percebido como adequado à prática profissional, mas ainda é um protótipo.

## 25. Limitações (0:40 — 18:35)

E é importante ser clara sobre as limitações. O sistema ainda não tem criptografia em repouso, registro de consentimento, base legal nem política de retenção, então não pode ser usado com dados reais de crianças. A auditoria ainda pode ser alterada por quem acessa o banco diretamente. Não há interoperabilidade com outros sistemas. Rodou apenas em ambiente local. E a avaliação teve cinco participantes, com questionário próprio, e os requisitos se basearam em uma única entrevista.

## 26. Trabalhos Futuros (0:40 — 19:15)

Como trabalhos futuros, o primeiro passo é a adequação completa à LGPD. Em seguida, criar a linha do tempo na página do aprendente e o campo de justificativa das adaptações, implementar pontuação automática nos instrumentos e ampliar os relatórios, com seções predefinidas e anexos. Também é preciso fazer testes manuais de acessibilidade e com pessoas com deficiência, e uma nova avaliação com mais profissionais, em produção e usando a escala SUS.

## 27. Obrigada! (0:10 — 19:25)

Agradeço a atenção de todos e fico à disposição para as perguntas da banca.

---

### Dicas

- Se estiver atrasada, encurte os slides 7 (Estudos Relacionados) e 13 (Ferramentas). São os mais fáceis de resumir sem perder conteúdo.
- Os slides 16 e 17 (segurança e versionamento) são o diferencial do trabalho: não corte esses.
- Possíveis perguntas da banca: por que não usar a SUS; por que a entrevista não passou pelo CEP; por que tokens no localStorage; como o sistema lidaria com dados reais.

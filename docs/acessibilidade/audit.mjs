// Auditoria de acessibilidade (axe-core) das telas principais, critérios WCAG 2.0/2.1/2.2 níveis A e AA.
//
// Uso, com o sistema rodando via `docker compose up -d` (executar na raiz do repositório):
//
//   docker run --rm --network tcc_psicopedagogia_net -v "$PWD/docs/acessibilidade:/work" -w /work \
//     mcr.microsoft.com/playwright:v1.49.0-noble bash -c \
//     "npm init -y >/dev/null && npm i --silent playwright@1.49.0 @axe-core/playwright@4.10.1 axe-core@4.10.2 && node audit.mjs"
//
// O resultado detalhado é gravado em axe-results.json. Credenciais e endereço podem ser
// alterados pelas variáveis BASE, EMAIL e PASSWORD.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://psicopedagogia_frontend';
const EMAIL = process.env.EMAIL || 'admin@psicopedagogia.com';
const PASSWORD = process.env.PASSWORD || 'Admin@123';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function api(path, token) {
  const res = await fetch(`${BASE}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) return null;
  return res.json();
}

// Procura o primeiro objeto com campo "id" dentro da resposta, qualquer que seja o formato.
function firstId(json) {
  const stack = [json];
  while (stack.length) {
    const v = stack.shift();
    if (Array.isArray(v)) { if (v.length && v[0] && v[0].id != null) return v[0].id; stack.push(...v); }
    else if (v && typeof v === 'object') stack.push(...Object.values(v));
  }
  return null;
}

const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const login = await loginRes.json();
const accessToken = login?.data?.accessToken;
const refreshToken = login?.data?.refreshToken;
if (!accessToken) { console.error('Falha no login', loginRes.status, JSON.stringify(login)); process.exit(1); }

const ids = {};
for (const r of ['aprendentes', 'avaliacoes', 'aplicacoes', 'relatorios']) ids[r] = firstId(await api(`/${r}`, accessToken));
console.log('IDs encontrados:', ids);

const pages = [
  ['Login', '/login', false],
  ['Cadastro', '/cadastro', false],
  ['Recuperação de senha', '/forgot-password', false],
  ['Dashboard', '/dashboard', true],
  ['Aprendentes (lista)', '/aprendentes', true],
  ['Aprendente (formulário)', '/aprendentes/novo', true],
  ['Aprendente (detalhe)', ids.aprendentes && `/aprendentes/${ids.aprendentes}`, true],
  ['Instrumentos (lista)', '/avaliacoes', true],
  ['Instrumento (formulário)', '/avaliacoes/nova', true],
  ['Instrumento (detalhe)', ids.avaliacoes && `/avaliacoes/${ids.avaliacoes}`, true],
  ['Aplicações (lista)', '/aplicacoes', true],
  ['Aplicação (nova)', '/aplicacoes/nova', true],
  ['Aplicação (preenchimento)', ids.aplicacoes && `/aplicacoes/${ids.aplicacoes}`, true],
  ['Relatórios (lista)', '/relatorios', true],
  ['Relatório (detalhe)', ids.relatorios && `/relatorios/${ids.relatorios}`, true],
  ['Usuários', '/users', true],
  ['Auditoria', '/auditoria', true],
  ['Alterar senha', '/perfil/senha', true],
].filter(([, path]) => path);

const browser = await chromium.launch();
const results = [];
for (const [name, path, auth] of pages) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-BR' });
  if (auth) {
    await context.addInitScript(([a, r]) => {
      localStorage.setItem('accessToken', a);
      localStorage.setItem('refreshToken', r);
    }, [accessToken, refreshToken]);
  }
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const finalPath = new URL(page.url()).pathname;
  const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  results.push({
    name, path, finalPath,
    violations: axe.violations.map(v => ({
      id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter(t => t.startsWith('wcag')),
      nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map(n => n.target.join(' ')),
      summary: v.nodes[0]?.failureSummary,
    })),
    passes: axe.passes.length,
    incomplete: axe.incomplete.map(v => ({ id: v.id, nodes: v.nodes.length })),
  });
  console.log(`${name.padEnd(28)} ${finalPath.padEnd(30)} violações: ${axe.violations.length} (nós: ${axe.violations.reduce((s, v) => s + v.nodes.length, 0)})`);
  await context.close();
}
await browser.close();
fs.writeFileSync('/work/axe-results.json', JSON.stringify({ date: new Date().toISOString(), tags: TAGS, results }, null, 2));

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../src/components/layout/AppLayout';
import { AuthContext } from '../src/contexts/AuthContext';

// O jsdom não aplica @media print; por isso a folha de estilo é verificada como texto
const css = readFileSync(resolve(process.cwd(), 'src/print.css'), 'utf8').replace(/\s+/g, ' ');
const printBlock = css.slice(css.indexOf('@media print'));

describe('Folha de estilo de impressão', () => {
  it('fora da impressão, o conteúdo exclusivo da impressão fica oculto', () => {
    expect(css.slice(0, css.indexOf('@media print'))).toMatch(/\.print-only \{ display: none; \}/);
  });

  it('na impressão, oculta a interface, exibe o conteúdo exclusivo e define a página A4', () => {
    expect(printBlock).toMatch(/\.no-print \{ display: none !important; \}/);
    expect(printBlock).toMatch(/\.print-only \{ display: block !important; \}/);
    expect(printBlock).toMatch(/@page \{ size: A4;/);
    expect(printBlock).toMatch(/\.print-block \{ break-inside: avoid;/);
    expect(printBlock).toMatch(/\.app-main \{ width: 100% !important;/);
  });

  it('o layout marca cabeçalho e menu lateral como fora da impressão', () => {
    const { container } = render(
      <AuthContext.Provider value={{ user: { name: 'Ana', role: 'PSICOPEDAGOGO' }, loading: false, logout: vi.fn(), isAdmin: false }}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<div>conteúdo</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(container.querySelector('header')).toHaveClass('no-print');
    expect(container.querySelector('nav')).toHaveClass('no-print');
    expect(container.querySelector('main')).toHaveClass('app-main');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from '../src/components/common/StatusChip';

describe('StatusChip', () => {
  it('renders ACTIVE status', () => {
    render(<StatusChip status="ACTIVE" />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renders COMPLETED status', () => {
    render(<StatusChip status="COMPLETED" />);
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
  });

  it('renders PENDING status', () => {
    render(<StatusChip status="PENDING" />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renders unknown status with raw value', () => {
    render(<StatusChip status="UNKNOWN_STATUS" />);
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });
});

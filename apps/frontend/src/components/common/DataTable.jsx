import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, Paper, CircularProgress, Typography,
} from '@mui/material';

const DataTable = ({
  columns, rows, total, page, rowsPerPage, onPageChange, onRowsPerPageChange,
  loading, emptyMessage = 'Nenhum registro encontrado',
}) => (
  <Paper>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align || 'left'} width={col.width}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <CircularProgress size={32} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={row.id || idx} hover>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || 'left'}>
                    {col.render ? col.render(row) : row[col.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    {total > 0 && (
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />
    )}
  </Paper>
);

export default DataTable;

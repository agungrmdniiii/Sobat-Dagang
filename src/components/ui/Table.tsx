import React from 'react';
import { cn } from '../../lib/utils';

export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'w-full overflow-x-auto rounded-[18px] border border-ink/10 bg-surface -mx-0',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => (
  <table className={cn('w-full text-left text-[13px] md:text-sm text-ink', className)} {...props}>
    {children}
  </table>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead className={cn('bg-[#dfd8c5] border-b border-ink/15 text-muted uppercase text-xs font-semibold tracking-wider', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <tbody className={cn('divide-y divide-ink/10', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr
    className={cn('hover:bg-bg/60 transition-colors duration-150', className)}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <th className={cn('py-3.5 px-6 font-medium', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <td className={cn('py-3.5 px-6 align-middle', className)} {...props}>
    {children}
  </td>
);

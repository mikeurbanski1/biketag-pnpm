import React from 'react';

import { Logger } from '@biketag/utils';

export interface TableProps<T extends Record<string, string | number>> {
    data: T[];
    // type attributes to 0-bsaed column index
    columnMapping: { attribute: keyof T; header: string; defaultDescending?: boolean }[];
    initialSort: { column: keyof T; ascending: boolean };
    tableClassName?: string;
}

export interface TableState {
    sortColumn: number;
    sortedAscending: boolean;
    tableData: (string | number)[][];
}

const logger = new Logger({ prefix: '[Table]' });

export class Table<T extends Record<string, string | number>> extends React.Component<TableProps<T>, TableState> {
    constructor(props: TableProps<T>) {
        super(props);
        const numColumns = Object.keys(props.columnMapping).length;
        this.state = {
            sortColumn: props.columnMapping.findIndex((column) => column.attribute === props.initialSort.column),
            sortedAscending: props.initialSort.ascending,
            tableData: props.data.map((row) => {
                const newRow = new Array<string | number>(numColumns);
                props.columnMapping.forEach((column, i) => {
                    newRow[i] = row[column.attribute];
                });
                return newRow;
            }),
        };
    }

    render() {
        logger.info(`[render]`, { state: this.state, props: this.props });
        return (
            <table className={this.props.tableClassName}>
                <thead>
                    <tr>
                        {Object.values(this.props.columnMapping).map((column, index) => (
                            <th
                                key={column.attribute.toString()}
                                className="clickable-text"
                                onClick={() => {
                                    if (this.state.sortColumn === index) {
                                        this.setState({ sortedAscending: !this.state.sortedAscending });
                                    } else {
                                        this.setState({ sortColumn: index, sortedAscending: column.defaultDescending ? false : true });
                                    }
                                }}
                            >
                                {column.header}
                                {this.state.sortColumn === index ? (this.state.sortedAscending ? '▲' : '▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {this.state.tableData
                        .sort((a, b) => {
                            const aVal = a[this.state.sortColumn];
                            const bVal = b[this.state.sortColumn];
                            if (typeof aVal === 'string' && typeof bVal === 'string') {
                                return this.state.sortedAscending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                                return this.state.sortedAscending ? aVal - bVal : bVal - aVal;
                            } else {
                                throw new Error('sorting a mixed type column');
                            }
                        })
                        .map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        );
    }
}
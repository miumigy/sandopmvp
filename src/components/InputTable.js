"use client";

import React, { useState } from "react";
import styles from "./InputTable.module.css";

export default function InputTable({ title, data, onChange, columns }) {
    const [focusedCell, setFocusedCell] = useState({ row: -1, col: "" });

    const handleChange = (index, field, value) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: Number(value) };
        onChange(newData);
    };

    const handlePaste = (e, rowIndex, colKey) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text");
        const rows = pasteData.split(/\r\n|\n|\r/).filter(row => row.trim() !== "");

        const newData = [...data];
        let dataChanged = false;

        rows.forEach((row, rIdx) => {
            const cells = row.split("\t");
            const targetRowIndex = rowIndex + rIdx;

            if (targetRowIndex < newData.length) {
                cells.forEach((cellValue, cIdx) => {
                    // Find the column key based on the starting column index
                    const colIndex = columns.findIndex(c => c.key === colKey);
                    const targetColIndex = colIndex + cIdx;

                    if (targetColIndex < columns.length) {
                        const targetColKey = columns[targetColIndex].key;
                        const numValue = Number(cellValue.replace(/[^0-9.-]+/g, "")); // Simple cleanup

                        if (!isNaN(numValue)) {
                            newData[targetRowIndex] = {
                                ...newData[targetRowIndex],
                                [targetColKey]: numValue
                            };
                            dataChanged = true;
                        }
                    }
                });
            }
        });

        if (dataChanged) {
            onChange(newData);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.headerCell}>Month</th>
                            {columns.map((col) => (
                                <th key={col.key} className={styles.headerCell}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                <td className={styles.monthCell}>{row.month}</td>
                                {columns.map((col) => (
                                    <td key={col.key} className={styles.cell}>
                                        <input
                                            type="number"
                                            value={row[col.key]}
                                            onChange={(e) => handleChange(index, col.key, e.target.value)}
                                            onPaste={(e) => handlePaste(e, index, col.key)}
                                            onFocus={() => setFocusedCell({ row: index, col: col.key })}
                                            onBlur={() => setFocusedCell({ row: -1, col: "" })}
                                            className={`${styles.input} ${focusedCell.row === index && focusedCell.col === col.key
                                                    ? styles.focused
                                                    : ""
                                                }`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

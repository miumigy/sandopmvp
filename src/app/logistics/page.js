"use client";

import React from "react";
import { useSOP } from "@/context/SOPContext";
import styles from "./page.module.css";

export default function LogisticsPage() {
    const { logisticsPlan, setLogisticsPlan } = useSOP();

    const handleChange = (field, value) => {
        setLogisticsPlan({ ...logisticsPlan, [field]: Number(value) });
    };

    return (
        <div>
            <h1>Logistics Plan</h1>
            <p>Configure logistics parameters and constraints.</p>

            <div className={styles.formContainer}>
                <div className={styles.formGroup}>
                    <label>Initial Inventory (Units)</label>
                    <input
                        type="number"
                        value={logisticsPlan?.initialInventory ?? 100}
                        onChange={(e) => handleChange("initialInventory", e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Max Warehouse Capacity (Units)</label>
                    <input
                        type="number"
                        value={logisticsPlan?.maxCapacity ?? 1000}
                        onChange={(e) => handleChange("maxCapacity", e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Fixed Warehouse Cost ($/Month)</label>
                    <input
                        type="number"
                        value={logisticsPlan?.fixedCost ?? 5000}
                        onChange={(e) => handleChange("fixedCost", e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Overflow Storage Cost ($/Unit)</label>
                    <input
                        type="number"
                        value={logisticsPlan?.overflowCost ?? 10}
                        onChange={(e) => handleChange("overflowCost", e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

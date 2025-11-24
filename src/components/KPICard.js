import React from "react";
import styles from "./KPICard.module.css";

export default function KPICard({ title, value, unit, trend, color = "blue" }) {
    return (
        <div className={`${styles.card} ${styles[color]}`}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.value}>
                {value} <span className={styles.unit}>{unit}</span>
            </div>
            {trend && <div className={styles.trend}>{trend}</div>}
        </div>
    );
}

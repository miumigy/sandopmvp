"use client";

import React from "react";
import { useSOP } from "@/context/SOPContext";
import InputTable from "@/components/InputTable";

export default function ProductionPage() {
    const { productionPlan, setProductionPlan } = useSOP();

    const columns = [
        { key: "quantity", label: "Production Quantity (Units)" },
        { key: "cost", label: "Unit Cost ($)" },
    ];

    return (
        <div>
            <h1>Production Plan</h1>
            <p>Enter the 12-month production schedule.</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                <strong>Note:</strong> Production quantities will arrive in the warehouse and become available as inventory in the <strong>following month</strong>.
            </p>
            <InputTable
                title="Monthly Production Schedule"
                data={productionPlan}
                onChange={setProductionPlan}
                columns={columns}
            />
        </div>
    );
}

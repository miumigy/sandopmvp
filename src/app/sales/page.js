"use client";

import React from "react";
import { useSOP } from "@/context/SOPContext";
import InputTable from "@/components/InputTable";

export default function SalesPage() {
    const { salesPlan, setSalesPlan } = useSOP();

    const columns = [
        { key: "quantity", label: "Sales Quantity (Units)" },
        { key: "price", label: "Unit Price ($)" },
    ];

    return (
        <div>
            <h1>Sales Plan</h1>
            <p>Enter the 12-month sales forecast.</p>
            <InputTable
                title="Monthly Sales Forecast"
                data={salesPlan}
                onChange={setSalesPlan}
                columns={columns}
            />
        </div>
    );
}

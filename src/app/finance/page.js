"use client";

import React from "react";
import { useSOP } from "@/context/SOPContext";
import InputTable from "@/components/InputTable";

export default function FinancePage() {
    const { financialPlan, setFinancialPlan } = useSOP();

    const columns = [
        { key: "budget", label: "Total Budget ($)" },
        // In a real app, we might break this down further (Revenue, COGS, Logistics Budget)
        // For MVP, we'll just track a general budget or maybe specific budgets if needed.
        // The user requirement says: "Sales Amount, Manufacturing Cost, Logistics Cost Budget".
        // Let's add those columns.
    ];

    // Wait, the user requirement says: "12 months monthly Sales Amount, Manufacturing Cost, Logistics Cost Budget".
    // My initial context only had `budget`. I should update the context and this page to reflect that.
    // I'll update the columns here and assume the data structure supports it.
    // I need to update `SOPContext.js` to include these fields in `financialPlan`.

    const expandedColumns = [
        { key: "salesBudget", label: "Sales Budget ($)" },
        { key: "productionBudget", label: "Production Budget ($)" },
        { key: "logisticsBudget", label: "Logistics Budget ($)" },
    ];

    return (
        <div>
            <h1>Financial Plan</h1>
            <p>Set the budget targets for each department.</p>
            <InputTable
                title="Monthly Financial Budgets"
                data={financialPlan}
                onChange={setFinancialPlan}
                columns={expandedColumns}
            />
        </div>
    );
}

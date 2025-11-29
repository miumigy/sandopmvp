import { NextResponse } from "next/server";
import {
    getSalesPlan,
    saveSalesPlan,
    getProductionPlan,
    saveProductionPlan,
    getFinancialPlan,
    saveFinancialPlan,
    getLogisticsPlan,
    saveLogisticsPlan,
    getScenarios,
    createScenario,
    cloneScenario,
} from "@/lib/db";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");
        const scenarioId = searchParams.get("scenarioId");

        if (action === "scenarios") {
            const scenarios = await getScenarios();
            return NextResponse.json({ scenarios });
        }

        if (!scenarioId) {
            return NextResponse.json({ error: "Scenario ID is required" }, { status: 400 });
        }

        const salesPlanRaw = await getSalesPlan(scenarioId);
        const productionPlanRaw = await getProductionPlan(scenarioId);
        const financialPlanRaw = await getFinancialPlan(scenarioId);
        const logisticsPlanRaw = await getLogisticsPlan(scenarioId);

        // Transform sales plan: ensure numbers
        const salesPlan = salesPlanRaw.map(row => ({
            ...row,
            quantity: Number(row.quantity),
            price: Number(row.price)
        }));

        // Transform production plan: ensure numbers
        const productionPlan = productionPlanRaw.map(row => ({
            ...row,
            quantity: Number(row.quantity),
            cost: Number(row.cost)
        }));

        // Transform financial plan from DB lowercase to frontend camelCase AND ensure numbers
        const financialPlan = financialPlanRaw.map(row => ({
            ...row,
            budget: Number(row.budget),
            salesBudget: Number(row.salesbudget ?? row.salesBudget),
            productionBudget: Number(row.productionbudget ?? row.productionBudget),
            logisticsBudget: Number(row.logisticsbudget ?? row.logisticsBudget)
        }));

        // Transform logistics plan from DB lowercase to frontend camelCase
        let logisticsPlan = null;
        if (logisticsPlanRaw) {
            logisticsPlan = {
                ...logisticsPlanRaw,
                initialInventory: Number(logisticsPlanRaw.initialinventory ?? logisticsPlanRaw.initialInventory ?? 100),
                maxCapacity: Number(logisticsPlanRaw.maxcapacity ?? logisticsPlanRaw.maxCapacity ?? 1000),
                fixedCost: Number(logisticsPlanRaw.fixedcost ?? logisticsPlanRaw.fixedCost ?? 5000),
                overflowCost: Number(logisticsPlanRaw.overflowcost ?? logisticsPlanRaw.overflowCost ?? 10)
            };
        }

        return NextResponse.json({
            salesPlan,
            productionPlan,
            financialPlan,
            logisticsPlan,
        });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, scenarioId, name, sourceId, salesPlan, productionPlan, financialPlan, logisticsPlan } = body;

        if (action === "create") {
            const newScenario = await createScenario(name);
            return NextResponse.json({ scenario: newScenario });
        }

        if (action === "clone") {
            const newScenario = await cloneScenario(sourceId, name);
            return NextResponse.json({ scenario: newScenario });
        }

        if (!scenarioId) {
            return NextResponse.json({ error: "Scenario ID is required for saving plans" }, { status: 400 });
        }

        if (salesPlan) await saveSalesPlan(scenarioId, salesPlan);
        if (productionPlan) await saveProductionPlan(scenarioId, productionPlan);
        if (financialPlan) {
            // Transform from frontend camelCase to DB lowercase
            const financialPlanDb = financialPlan.map(row => ({
                ...row,
                salesbudget: row.salesBudget,
                productionbudget: row.productionBudget,
                logisticsbudget: row.logisticsBudget
            }));
            await saveFinancialPlan(scenarioId, financialPlanDb);
        }
        if (logisticsPlan) await saveLogisticsPlan(scenarioId, logisticsPlan);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

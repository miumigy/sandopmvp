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
            const scenarios = getScenarios();
            return NextResponse.json({ scenarios });
        }

        if (!scenarioId) {
            return NextResponse.json({ error: "Scenario ID is required" }, { status: 400 });
        }

        const salesPlan = getSalesPlan(scenarioId);
        const productionPlan = getProductionPlan(scenarioId);
        const financialPlan = getFinancialPlan(scenarioId);
        const logisticsPlan = getLogisticsPlan(scenarioId);

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
            const newScenario = createScenario(name);
            return NextResponse.json({ scenario: newScenario });
        }

        if (action === "clone") {
            const newScenario = cloneScenario(sourceId, name);
            return NextResponse.json({ scenario: newScenario });
        }

        if (!scenarioId) {
            return NextResponse.json({ error: "Scenario ID is required for saving plans" }, { status: 400 });
        }

        if (salesPlan) saveSalesPlan(scenarioId, salesPlan);
        if (productionPlan) saveProductionPlan(scenarioId, productionPlan);
        if (financialPlan) saveFinancialPlan(scenarioId, financialPlan);
        if (logisticsPlan) saveLogisticsPlan(scenarioId, logisticsPlan);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

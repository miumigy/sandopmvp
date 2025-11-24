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
} from "@/lib/db";

export async function GET() {
    try {
        const salesPlan = getSalesPlan();
        const productionPlan = getProductionPlan();
        const financialPlan = getFinancialPlan();
        const logisticsPlan = getLogisticsPlan();

        // If database is empty, return null or empty arrays to let frontend use defaults
        // But frontend expects 12 months.
        // Let's handle this in the frontend or ensure DB returns defaults if empty?
        // For simplicity, if DB is empty, we return empty arrays and frontend handles it.

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
        const { salesPlan, productionPlan, financialPlan, logisticsPlan } = body;

        if (salesPlan) saveSalesPlan(salesPlan);
        if (productionPlan) saveProductionPlan(productionPlan);
        if (financialPlan) saveFinancialPlan(financialPlan);
        if (logisticsPlan) saveLogisticsPlan(logisticsPlan);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

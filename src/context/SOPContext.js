"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { calculatePSI } from "@/lib/psiLogic";
import { generateProposal } from "@/lib/aiLogic";

const SOPContext = createContext();

export const useSOP = () => useContext(SOPContext);

export const SOPProvider = ({ children }) => {
    // Initial Data
    const initialMonths = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        quantity: 0,
        price: 0,
        cost: 0,
        budget: 0,
        salesBudget: 0,
        productionBudget: 0,
        logisticsBudget: 0,
    }));

    const [salesPlan, setSalesPlan] = useState(initialMonths);
    const [productionPlan, setProductionPlan] = useState(initialMonths);
    const [logisticsPlan, setLogisticsPlan] = useState({
        initialInventory: 100,
        maxCapacity: 1000,
        fixedCost: 5000,
        overflowCost: 10,
    });
    const [financialPlan, setFinancialPlan] = useState(initialMonths);

    const [psiResults, setPsiResults] = useState({
        inventory: [],
        opportunityLoss: [],
        storageCost: [],
        monthlySalesAmount: [],
        monthlyProductionCost: [],
        monthlyLogisticsCost: [],
        monthlyProfit: [],
    });

    const [aiProposals, setAiProposals] = useState([]);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/data");
                const data = await res.json();

                if (data.salesPlan && data.salesPlan.length > 0) setSalesPlan(data.salesPlan);
                if (data.productionPlan && data.productionPlan.length > 0) setProductionPlan(data.productionPlan);
                if (data.financialPlan && data.financialPlan.length > 0) setFinancialPlan(data.financialPlan);
                if (data.logisticsPlan) setLogisticsPlan(data.logisticsPlan);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    // Recalculate PSI whenever plans change
    useEffect(() => {
        const results = calculatePSI(salesPlan, productionPlan, logisticsPlan);
        setPsiResults(results);

        const proposals = generateProposal(salesPlan, productionPlan, logisticsPlan, results);
        setAiProposals(proposals);
    }, [salesPlan, productionPlan, logisticsPlan]);

    const saveData = async () => {
        try {
            await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    salesPlan,
                    productionPlan,
                    financialPlan,
                    logisticsPlan,
                }),
            });
            alert("Data saved successfully!");
        } catch (error) {
            console.error("Failed to save data:", error);
            alert("Failed to save data.");
        }
    };

    const value = {
        salesPlan,
        setSalesPlan,
        productionPlan,
        setProductionPlan,
        logisticsPlan,
        setLogisticsPlan,
        financialPlan,
        setFinancialPlan,
        psiResults,
        aiProposals,
        saveData,
    };

    return <SOPContext.Provider value={value}>{children}</SOPContext.Provider>;
};

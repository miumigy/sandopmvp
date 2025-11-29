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

    const [scenarios, setScenarios] = useState([]);
    const [currentScenario, setCurrentScenario] = useState(null);

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

    // Fetch Scenarios on mount
    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const res = await fetch("/api/data?action=scenarios");
                const data = await res.json();
                if (data.scenarios && data.scenarios.length > 0) {
                    setScenarios(data.scenarios);
                    setCurrentScenario(data.scenarios[0]); // Default to first
                }
            } catch (error) {
                console.error("Failed to fetch scenarios:", error);
            }
        };
        fetchScenarios();
    }, []);

    // Fetch Plan Data when currentScenario changes
    useEffect(() => {
        if (!currentScenario) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/data?scenarioId=${currentScenario.id}`);
                const data = await res.json();

                if (data.salesPlan && data.salesPlan.length > 0) setSalesPlan(data.salesPlan);
                else setSalesPlan(initialMonths); // Reset if empty

                if (data.productionPlan && data.productionPlan.length > 0) setProductionPlan(data.productionPlan);
                else setProductionPlan(initialMonths);

                if (data.financialPlan && data.financialPlan.length > 0) setFinancialPlan(data.financialPlan);
                else setFinancialPlan(initialMonths);

                if (data.logisticsPlan) setLogisticsPlan(data.logisticsPlan);
                else setLogisticsPlan({
                    initialInventory: 100,
                    maxCapacity: 1000,
                    fixedCost: 5000,
                    overflowCost: 10,
                });
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [currentScenario]);

    // Recalculate PSI whenever plans change
    useEffect(() => {
        const results = calculatePSI(salesPlan, productionPlan, logisticsPlan);
        setPsiResults(results);

        const proposals = generateProposal(salesPlan, productionPlan, logisticsPlan, results);
        setAiProposals(proposals);
    }, [salesPlan, productionPlan, logisticsPlan]);

    const saveData = async () => {
        if (!currentScenario) return;
        try {
            await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenarioId: currentScenario.id,
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

    const createNewScenario = async (name) => {
        try {
            const res = await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", name }),
            });
            const data = await res.json();
            if (data.scenario) {
                setScenarios([...scenarios, data.scenario]);
                setCurrentScenario(data.scenario);
            }
        } catch (error) {
            console.error("Failed to create scenario:", error);
        }
    };

    const cloneCurrentScenario = async (name) => {
        if (!currentScenario) return;
        try {
            const res = await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "clone",
                    sourceId: currentScenario.id,
                    name,
                }),
            });
            const data = await res.json();
            if (data.scenario) {
                setScenarios([...scenarios, data.scenario]);
                setCurrentScenario(data.scenario);
            }
        } catch (error) {
            console.error("Failed to clone scenario:", error);
        }
    };

    const value = {
        scenarios,
        currentScenario,
        setCurrentScenario,
        createNewScenario,
        cloneCurrentScenario,
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

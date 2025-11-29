"use client";

import React from "react";
import { useSOP } from "@/context/SOPContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import KPICard from "@/components/KPICard";
import styles from "./page.module.css";

export default function Dashboard() {
  const { salesPlan, productionPlan, psiResults, aiProposals, logisticsPlan, financialPlan } = useSOP();

  // Number formatter for charts
  const formatNumber = (value) => {
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  // Prepare data for charts
  const chartData = salesPlan.map((sale, index) => ({
    month: `M${sale.month}`,
    sales: psiResults.monthlySoldQty ? psiResults.monthlySoldQty[index] : 0,
    production: productionPlan[index]?.quantity || 0,
    inventory: psiResults.inventory[index] || 0,
    loss: psiResults.opportunityLoss[index] || 0,

    // Financials
    salesAmount: psiResults.monthlySalesAmount[index] || 0,
    profit: psiResults.monthlyProfit[index] || 0,
    salesBudget: financialPlan[index]?.salesBudget || 0,
    // We don't have a direct profit budget per month in the simple input, 
    // but we can derive it or just compare Sales vs Sales Budget for now.
  }));

  // Calculate Totals
  const totalSalesQty = salesPlan.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalProductionQty = productionPlan.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalLossQty = psiResults.opportunityLoss.reduce((acc, curr) => acc + curr, 0);
  const currentInventory = psiResults.inventory[psiResults.inventory.length - 1] || 0;

  const totalSalesAmount = psiResults.monthlySalesAmount.reduce((acc, curr) => acc + curr, 0);
  const totalProfit = psiResults.monthlyProfit.reduce((acc, curr) => acc + curr, 0);

  const totalSalesBudget = financialPlan.reduce((acc, curr) => acc + Number(curr.salesBudget || 0), 0);

  const salesAchievementRate = totalSalesBudget > 0 ? ((totalSalesAmount / totalSalesBudget) * 100).toFixed(1) : 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>S&OP Dashboard</h1>

      <div className={styles.kpiGrid}>
        <KPICard title="Total Sales (Qty)" value={totalSalesQty} unit="Units" color="blue" />
        <KPICard title="Total Production (Qty)" value={totalProductionQty} unit="Units" color="green" />
        <KPICard title="Current Inventory" value={currentInventory} unit="Units" color="yellow" />
        <KPICard title="Opportunity Loss" value={totalLossQty} unit="Units" color="red" />
      </div>

      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Sales Amount"
          value={`$${totalSalesAmount.toLocaleString()}`}
          unit=""
          color="blue"
          trend={`Budget: $${totalSalesBudget.toLocaleString()} (${salesAchievementRate}%)`}
        />
        <KPICard title="Total Profit" value={`$${totalProfit.toLocaleString()}`} unit="" color="green" />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>PSI Overview (vs Capacity)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Bar dataKey="sales" fill="#0070f3" name="Sales" />
              <Bar dataKey="production" fill="#10b981" name="Production" />
              <Line type="monotone" dataKey="inventory" stroke="#f59e0b" strokeWidth={2} name="Inventory" />
              <ReferenceLine y={Number(logisticsPlan?.maxCapacity || 0)} label="Max Cap" stroke="red" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Financial Performance (Sales vs Budget)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Line type="monotone" dataKey="salesAmount" stroke="#0070f3" strokeWidth={2} name="Actual Sales ($)" />
              <Line type="monotone" dataKey="salesBudget" stroke="#94a3b8" strokeDasharray="5 5" name="Budget ($)" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Opportunity Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Bar dataKey="loss" fill="#ef4444" name="Lost Sales (Qty)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.aiSection}>
        <h2>AI Plan Adjustments Proposals</h2>
        {aiProposals.length === 0 ? (
          <p className={styles.noProposals}>No adjustments needed. Plan looks good!</p>
        ) : (
          <div className={styles.proposalList}>
            {aiProposals.map((proposal, index) => (
              <div key={index} className={styles.proposalCard}>
                <div className={styles.proposalHeader}>
                  <span className={styles.proposalType}>{proposal.type}</span>
                  <span className={styles.proposalMonth}>Month {proposal.month}</span>
                </div>
                <p className={styles.proposalMessage}>{proposal.message}</p>
                <p className={styles.proposalImpact}>Impact: {proposal.impact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

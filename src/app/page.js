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
  Area,
} from "recharts";
import KPICard from "@/components/KPICard";
import styles from "./page.module.css";

export default function Dashboard() {
  const { salesPlan, productionPlan, psiResults, aiProposals, logisticsPlan, financialPlan } = useSOP();

  // Number formatter for charts
  const formatNumber = (value) => {
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  // Safety checks for data
  if (!salesPlan || !productionPlan || !psiResults || !financialPlan || !logisticsPlan) {
    return <div className={styles.container}><h1>Loading...</h1></div>;
  }

  // Prepare data for charts
  const chartData = salesPlan.map((sale, index) => ({
    month: `M${sale.month}`,
    sales: psiResults.monthlySoldQty ? psiResults.monthlySoldQty[index] : 0,
    demand: sale.quantity,
    production: productionPlan[index]?.quantity || 0,
    inventory: psiResults.inventory[index] || 0,
    loss: psiResults.opportunityLoss[index] || 0,

    // Financials
    salesAmount: psiResults.monthlySalesAmount[index] || 0,
    profit: psiResults.monthlyProfit[index] || 0,
    salesBudget: financialPlan[index]?.salesBudget || 0,
    productionBudget: financialPlan[index]?.productionBudget || 0,

    // Costs
    productionCost: psiResults.monthlyProductionCost[index] || 0,
    logisticsCost: psiResults.monthlyLogisticsCost[index] || 0,
    totalCost: (psiResults.monthlyProductionCost[index] || 0) + (psiResults.monthlyLogisticsCost[index] || 0),
  }));

  // Cumulative profit data
  let cumulativeProfit = 0;
  const cumulativeData = chartData.map(item => {
    cumulativeProfit += item.profit;
    return {
      ...item,
      cumulativeProfit,
    };
  });

  // Calculate Totals
  const totalSalesQty = salesPlan.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalProductionQty = productionPlan.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalLossQty = psiResults.opportunityLoss?.reduce((acc, curr) => acc + curr, 0) || 0;
  const currentInventory = psiResults.inventory?.[psiResults.inventory.length - 1] || 0;

  const totalSalesAmount = psiResults.monthlySalesAmount?.reduce((acc, curr) => acc + curr, 0) || 0;
  const totalProfit = psiResults.monthlyProfit?.reduce((acc, curr) => acc + curr, 0) || 0;

  const totalSalesBudget = financialPlan.reduce((acc, curr) => acc + Number(curr.salesBudget || 0), 0);
  const totalProductionBudget = financialPlan.reduce((acc, curr) => acc + Number(curr.productionBudget || 0), 0);
  const totalLogisticsBudget = financialPlan.reduce((acc, curr) => acc + Number(curr.logisticsBudget || 0), 0);
  const totalProfitBudget = totalSalesBudget - totalProductionBudget - totalLogisticsBudget;

  const salesAchievementRate = totalSalesBudget > 0 ? ((totalSalesAmount / totalSalesBudget) * 100).toFixed(1) : 0;
  const profitAchievementRate = totalProfitBudget > 0 ? ((totalProfit / totalProfitBudget) * 100).toFixed(1) : 0;

  // New KPIs
  const totalStorageCost = psiResults.monthlyLogisticsCost?.reduce((acc, curr) => acc + curr, 0) || 0;
  const totalProductionCost = psiResults.monthlyProductionCost?.reduce((acc, curr) => acc + curr, 0) || 0;

  const avgInventory = psiResults.inventory?.reduce((acc, curr) => acc + curr, 0) / (psiResults.inventory?.length || 1) || 0;
  const maxCapacity = Number(logisticsPlan?.maxCapacity || 0);
  const capacityUtilization = maxCapacity > 0 ? ((avgInventory / maxCapacity) * 100).toFixed(1) : 0;

  const totalDemand = salesPlan.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalFulfilled = psiResults.monthlySoldQty?.reduce((acc, curr) => acc + curr, 0) || 0;
  const serviceLevel = totalDemand > 0 ? ((totalFulfilled / totalDemand) * 100).toFixed(1) : 0;

  const totalProductionActual = psiResults.monthlyProductionCost?.reduce((acc, curr) => acc + curr, 0) || 0;
  const productionAchievementRate = totalProductionBudget > 0 ? ((totalProductionActual / totalProductionBudget) * 100).toFixed(1) : 0;

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
        <KPICard
          title="Total Profit"
          value={`$${totalProfit.toLocaleString()}`}
          unit=""
          color="green"
          trend={`Budget: $${totalProfitBudget.toLocaleString()} (${profitAchievementRate}%)`}
        />
      </div>

      <div className={styles.kpiGrid}>
        <KPICard
          title="Storage Cost"
          value={`$${totalStorageCost.toLocaleString()}`}
          unit=""
          color="yellow"
          trend={`Budget: $${totalLogisticsBudget.toLocaleString()}`}
        />
        <KPICard
          title="Production Cost"
          value={`$${totalProductionCost.toLocaleString()}`}
          unit=""
          color="green"
          trend={`Budget: $${totalProductionBudget.toLocaleString()} (${productionAchievementRate}%)`}
        />
        <KPICard
          title="Capacity Utilization"
          value={`${capacityUtilization}%`}
          unit=""
          color={capacityUtilization > 80 ? "red" : "blue"}
          trend={`Avg Inv: ${Math.round(avgInventory)} / Max: ${maxCapacity}`}
        />
        <KPICard
          title="Service Level"
          value={`${serviceLevel}%`}
          unit=""
          color={serviceLevel < 95 ? "red" : "green"}
          trend={`Fulfilled: ${totalFulfilled.toLocaleString()} / ${totalDemand.toLocaleString()}`}
        />
      </div>

      <h2 className={styles.sectionTitle}>Operations</h2>
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
          <h3>Production vs Demand</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Bar dataKey="demand" fill="#94a3b8" name="Demand" />
              <Bar dataKey="production" fill="#10b981" name="Production" />
              <Bar dataKey="sales" fill="#0070f3" name="Actual Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Inventory Trend with Thresholds</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <defs>
                <linearGradient id="inventoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="inventory" stroke="#f59e0b" fill="url(#inventoryGradient)" name="Inventory" />
              <ReferenceLine y={maxCapacity} label="Max Capacity" stroke="red" strokeDasharray="3 3" />
              <ReferenceLine y={maxCapacity * 0.2} label="Safety Stock (20%)" stroke="green" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Financial</h2>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Bar dataKey="productionCost" stackId="a" fill="#10b981" name="Production Cost" />
              <Bar dataKey="logisticsCost" stackId="a" fill="#f59e0b" name="Logistics Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Cumulative Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Line type="monotone" dataKey="cumulativeProfit" stroke="#10b981" strokeWidth={3} name="Cumulative Profit ($)" />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            </LineChart>
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
      </div>

      <h2 className={styles.sectionTitle}>Performance</h2>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Budget vs Actual Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={formatNumber} />
              <Legend />
              <Bar dataKey="salesBudget" fill="#94a3b8" name="Sales Budget" />
              <Bar dataKey="salesAmount" fill="#0070f3" name="Sales Actual" />
            </BarChart>
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

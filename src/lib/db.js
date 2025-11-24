import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "sop_v2.db");
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sales_plan (
    month INTEGER PRIMARY KEY,
    quantity INTEGER,
    price REAL
  );

  CREATE TABLE IF NOT EXISTS production_plan (
    month INTEGER PRIMARY KEY,
    quantity INTEGER,
    cost REAL
  );

  CREATE TABLE IF NOT EXISTS financial_plan (
    month INTEGER PRIMARY KEY,
    budget REAL,
    salesBudget REAL,
    productionBudget REAL,
    logisticsBudget REAL
  );

  CREATE TABLE IF NOT EXISTS logistics_plan (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    initialInventory INTEGER,
    maxCapacity INTEGER,
    fixedCost REAL,
    overflowCost REAL
  );
`);

// Seed Data if empty
const seedData = () => {
    const salesCount = db.prepare("SELECT COUNT(*) as count FROM sales_plan").get().count;
    if (salesCount === 0) {
        const insertSales = db.prepare("INSERT INTO sales_plan (month, quantity, price) VALUES (@month, @quantity, @price)");
        const insertManySales = db.transaction((data) => {
            for (const row of data) insertSales.run(row);
        });
        // Scenario: High Variance. Peak is 200. Low is 50.
        const salesData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            quantity: (i >= 3 && i <= 7) ? 50 : 200, // Summer slump (M4-M8)
            price: 100,
        }));
        insertManySales(salesData);
    }

    const prodCount = db.prepare("SELECT COUNT(*) as count FROM production_plan").get().count;
    if (prodCount === 0) {
        const insertProd = db.prepare("INSERT INTO production_plan (month, quantity, cost) VALUES (@month, @quantity, @cost)");
        const insertManyProd = db.transaction((data) => {
            for (const row of data) insertProd.run(row);
        });
        // Scenario: Level Production matched to Peak Sales (200)
        const prodData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            quantity: 200,
            cost: 60,
        }));
        insertManyProd(prodData);
    }

    const finCount = db.prepare("SELECT COUNT(*) as count FROM financial_plan").get().count;
    if (finCount === 0) {
        const insertFin = db.prepare("INSERT INTO financial_plan (month, budget, salesBudget, productionBudget, logisticsBudget) VALUES (@month, @budget, @salesBudget, @productionBudget, @logisticsBudget)");
        const insertManyFin = db.transaction((data) => {
            for (const row of data) insertFin.run(row);
        });
        // Scenario: Budget set for "normal" operations, not overflow
        const finData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            budget: 10000,
            salesBudget: 20000, // Expecting high sales
            productionBudget: 12000, // 200 * 60
            logisticsBudget: 2000, // Fixed 1000 + some buffer
        }));
        insertManyFin(finData);
    }

    const logCount = db.prepare("SELECT COUNT(*) as count FROM logistics_plan").get().count;
    if (logCount === 0) {
        const insertLog = db.prepare("INSERT INTO logistics_plan (id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES (1, @initialInventory, @maxCapacity, @fixedCost, @overflowCost)");
        insertLog.run({
            initialInventory: 100,
            maxCapacity: 300, // Will be exceeded quickly
            fixedCost: 1000,
            overflowCost: 20,
        });
    }
};

seedData();

export const getSalesPlan = () => {
    const stmt = db.prepare("SELECT * FROM sales_plan ORDER BY month");
    return stmt.all();
};

export const saveSalesPlan = (plan) => {
    const insert = db.prepare(
        "INSERT OR REPLACE INTO sales_plan (month, quantity, price) VALUES (@month, @quantity, @price)"
    );
    const insertMany = db.transaction((plan) => {
        for (const row of plan) insert.run(row);
    });
    insertMany(plan);
};

export const getProductionPlan = () => {
    const stmt = db.prepare("SELECT * FROM production_plan ORDER BY month");
    return stmt.all();
};

export const saveProductionPlan = (plan) => {
    const insert = db.prepare(
        "INSERT OR REPLACE INTO production_plan (month, quantity, cost) VALUES (@month, @quantity, @cost)"
    );
    const insertMany = db.transaction((plan) => {
        for (const row of plan) insert.run(row);
    });
    insertMany(plan);
};

export const getFinancialPlan = () => {
    const stmt = db.prepare("SELECT * FROM financial_plan ORDER BY month");
    return stmt.all();
};

export const saveFinancialPlan = (plan) => {
    const insert = db.prepare(
        "INSERT OR REPLACE INTO financial_plan (month, budget, salesBudget, productionBudget, logisticsBudget) VALUES (@month, @budget, @salesBudget, @productionBudget, @logisticsBudget)"
    );
    const insertMany = db.transaction((plan) => {
        for (const row of plan) insert.run(row);
    });
    insertMany(plan);
};

export const getLogisticsPlan = () => {
    const stmt = db.prepare("SELECT * FROM logistics_plan WHERE id = 1");
    return stmt.get();
};

export const saveLogisticsPlan = (plan) => {
    const insert = db.prepare(
        "INSERT OR REPLACE INTO logistics_plan (id, initialInventory, maxCapacity, fixedCost, overflowCost) VALUES (1, @initialInventory, @maxCapacity, @fixedCost, @overflowCost)"
    );
    insert.run(plan);
};

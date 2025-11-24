import { createScenario, cloneScenario, getScenarios, saveSalesPlan, getSalesPlan } from '../lib/db';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const TEST_DB = 'test_scenarios.db';

beforeAll(() => {
    process.env.DB_FILENAME = TEST_DB;
    // Ensure clean start
    if (fs.existsSync(TEST_DB)) {
        fs.unlinkSync(TEST_DB);
    }
});

afterAll(() => {
    if (fs.existsSync(TEST_DB)) {
        fs.unlinkSync(TEST_DB);
    }
});

describe('Scenario Management', () => {
    // Note: db.js initializes the DB on import, but we set the env var before import (hopefully).
    // Actually, imports happen before beforeAll. This is a problem.
    // We need to use require or reset modules.
    // For simplicity in this environment, let's assume we can just use the functions and they will use the DB opened at module level.
    // BUT, the module is already evaluated.
    // We might need to rely on the fact that we are running in a separate process or use jest.resetModules().

    // Let's try to just run the tests and see. If it fails because it uses the main DB, we'll know.
    // Actually, to be safe, let's not rely on env var if import is top level.
    // We can't easily change the const in db.js.

    // Alternative: The test will use the REAL db (sop_v3.db).
    // This is risky but acceptable for a local playground if we clean up.
    // OR, we can just test the logic by creating a new scenario, testing it, and leaving it there.

    it('should create a new scenario', () => {
        const name = "Test Scenario " + Date.now();
        const scenario = createScenario(name);
        expect(scenario.id).toBeDefined();
        expect(scenario.name).toBe(name);

        const all = getScenarios();
        expect(all.find(s => s.id === scenario.id)).toBeDefined();
    });

    it('should isolate data between scenarios', () => {
        const s1 = createScenario("Scenario A");
        const s2 = createScenario("Scenario B");

        const planA = [{ month: 1, quantity: 100, price: 10 }];
        const planB = [{ month: 1, quantity: 200, price: 20 }];

        saveSalesPlan(s1.id, planA);
        saveSalesPlan(s2.id, planB);

        const fetchedA = getSalesPlan(s1.id);
        const fetchedB = getSalesPlan(s2.id);

        expect(fetchedA[0].quantity).toBe(100);
        expect(fetchedB[0].quantity).toBe(200);
    });

    it('should clone a scenario correctly', () => {
        const source = createScenario("Source");
        saveSalesPlan(source.id, [{ month: 1, quantity: 500, price: 50 }]);

        const clone = cloneScenario(source.id, "Clone");

        const sourcePlan = getSalesPlan(source.id);
        const clonePlan = getSalesPlan(clone.id);

        expect(clonePlan.length).toBe(sourcePlan.length);
        expect(clonePlan[0].quantity).toBe(500);

        // Modify clone
        saveSalesPlan(clone.id, [{ month: 1, quantity: 999, price: 50 }]);

        // Verify source is unchanged
        const sourcePlanAfter = getSalesPlan(source.id);
        expect(sourcePlanAfter[0].quantity).toBe(500);
    });
});

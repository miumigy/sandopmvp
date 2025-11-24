"use client";

import React, { useState } from "react";
import { useSOP } from "@/context/SOPContext";
import { Plus, Copy, Check, X } from "lucide-react";
import styles from "./ScenarioSelector.module.css";

export default function ScenarioSelector() {
    const { scenarios, currentScenario, setCurrentScenario, createNewScenario, cloneCurrentScenario } = useSOP();
    const [isCreating, setIsCreating] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [newName, setNewName] = useState("");

    const handleChange = (e) => {
        const selectedId = parseInt(e.target.value);
        const scenario = scenarios.find((s) => s.id === selectedId);
        if (scenario) setCurrentScenario(scenario);
    };

    const startCreating = () => {
        setIsCreating(true);
        setIsCloning(false);
        setNewName("");
    };

    const startCloning = () => {
        setIsCloning(true);
        setIsCreating(false);
        setNewName(`${currentScenario.name} (Copy)`);
    };

    const handleSave = () => {
        if (!newName.trim()) return;

        if (isCreating) {
            createNewScenario(newName);
        } else if (isCloning) {
            cloneCurrentScenario(newName);
        }

        reset();
    };

    const reset = () => {
        setIsCreating(false);
        setIsCloning(false);
        setNewName("");
    };

    if (!currentScenario) return null;

    if (isCreating || isCloning) {
        return (
            <div className={styles.container}>
                <input
                    type="text"
                    className={styles.input}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isCreating ? "New Scenario Name" : "Clone Name"}
                    autoFocus
                />
                <button className={styles.button} onClick={handleSave} title="Save">
                    <Check size={16} />
                </button>
                <button className={styles.button} onClick={reset} title="Cancel">
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <select
                className={styles.select}
                value={currentScenario.id}
                onChange={handleChange}
            >
                {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>
            <button className={styles.button} onClick={startCreating} title="New Scenario">
                <Plus size={16} />
            </button>
            <button className={styles.button} onClick={startCloning} title="Clone Current Scenario">
                <Copy size={16} />
            </button>
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Factory, Truck, DollarSign, Save } from "lucide-react";
import styles from "./Layout.module.css";
import { useSOP } from "@/context/SOPContext";
import ScenarioSelector from "./ScenarioSelector";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Sales Plan", href: "/sales", icon: ShoppingCart },
    { name: "Production Plan", href: "/production", icon: Factory },
    { name: "Logistics Plan", href: "/logistics", icon: Truck },
    { name: "Financial Plan", href: "/finance", icon: DollarSign },
];

export default function Layout({ children }) {
    const pathname = usePathname();
    const { saveData } = useSOP();

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>S&OP Planner</div>
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        {navItems.find((item) => item.href === pathname)?.name || "S&OP Planner"}
                    </h1>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <ScenarioSelector />
                        <button onClick={saveData} className={styles.saveButton}>
                            <Save size={18} />
                            Save Data
                        </button>
                    </div>
                </header>
                <div className={styles.content}>{children}</div>
            </main>
        </div>
    );
}

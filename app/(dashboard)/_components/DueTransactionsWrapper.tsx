"use client";

import dynamic from "next/dynamic";
import type { UserSettings } from "@prisma/client";

const DueTransactionsPopup = dynamic(
    () => import("./DueTransactionsPopup").then(mod => ({ default: mod.DueTransactionsPopup })),
    { ssr: false }
);

export function DueTransactionsWrapper({ userSettings }: { userSettings: UserSettings }) {
    return <DueTransactionsPopup userSettings={userSettings} />;
}

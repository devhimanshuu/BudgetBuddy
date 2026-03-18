"use client";

import { CATEGORY_CONFIG } from "./VaultContent";
import type { VaultEntry } from "./VaultContent";
import { format } from "date-fns";

interface VaultPrintViewProps {
	entries: VaultEntry[];
	userName: string;
}

export default function VaultPrintView({
	entries,
	userName,
}: VaultPrintViewProps) {
	return (
		<div className="hidden print:block p-8 bg-white text-black font-serif">
			{/* Watermark/Header */}
			<div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
				<div>
					<h1 className="text-3xl font-bold uppercase tracking-tighter">
						Legacy Vault Summary
					</h1>
					<p className="text-sm font-bold opacity-70">
						Proprietary & Highly Confidential
					</p>
				</div>
				<div className="text-right">
					<p className="font-bold">Owner: {userName}</p>
					<p className="text-xs">Generated on: {format(new Date(), "PPP")}</p>
				</div>
			</div>

			<div className="bg-yellow-50 border-2 border-yellow-200 p-4 mb-8 text-sm italic">
				WARNING: This document contains sensitive personal information.
				Store in a physically secure location (e.g., a home safe or safety deposit box).
				Do not share these contents digitally.
			</div>

			<div className="space-y-8">
				{entries.map((entry, index) => {
					const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.other;
					return (
						<div key={entry.id} className="border border-gray-300 p-4 break-inside-avoid">
							<div className="flex justify-between items-start mb-4">
								<div>
									<h2 className="text-xl font-bold uppercase underline">
										{index + 1}. {entry.title}
									</h2>
									<p className="text-sm font-bold text-gray-600">
										Category: {config.label} | Sensitivity: {entry.sensitivity.toUpperCase()}
									</p>
								</div>
								<div className="text-3xl">{entry.icon}</div>
							</div>

							<div className="bg-gray-50 p-4 border border-dashed border-gray-400 whitespace-pre-wrap font-mono text-sm">
								{entry.content}
							</div>

							{entry.notes && (
								<div className="mt-4 text-xs italic text-gray-700">
									<strong>Additional Notes:</strong> {entry.notes}
								</div>
							)}

							<div className="mt-2 text-[10px] text-gray-500 text-right">
								ID: {entry.id} | Last Modified: {format(new Date(entry.updatedAt), "PP")}
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-12 pt-8 border-t border-gray-400 text-center text-xs text-gray-500">
				End of Report — Total Entries: {entries.length}
			</div>
		</div>
	);
}

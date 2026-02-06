"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

interface CSVRow {
    [key: string]: string;
}

interface ColumnMapping {
    date: string;
    amount: string;
    description: string;
    type: string;
    category: string;
    notes: string;
}

interface ImportResult {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: any }>;
}

export default function CSVImportDialog() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<CSVRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        date: "",
        amount: "",
        description: "",
        type: "",
        category: "",
        notes: "",
    });
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        if (!uploadedFile.name.endsWith(".csv")) {
            toast.error("Please upload a CSV file");
            return;
        }

        setFile(uploadedFile);
        setResult(null);

        Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as CSVRow[];
                setCsvData(data);

                if (data.length > 0) {
                    const cols = Object.keys(data[0]);
                    setHeaders(cols);

                    // Auto-detect common column names
                    const autoMapping: ColumnMapping = {
                        date: "",
                        amount: "",
                        description: "",
                        type: "",
                        category: "",
                        notes: "",
                    };

                    cols.forEach((col) => {
                        const lower = col.toLowerCase();
                        if (lower.includes("date") || lower.includes("posted")) {
                            autoMapping.date = col;
                        } else if (lower.includes("amount") || lower.includes("value") || lower.includes("price")) {
                            autoMapping.amount = col;
                        } else if (lower.includes("description") || lower.includes("memo") || lower.includes("payee")) {
                            autoMapping.description = col;
                        } else if (lower.includes("type") || lower.includes("transaction type")) {
                            autoMapping.type = col;
                        } else if (lower.includes("category")) {
                            autoMapping.category = col;
                        } else if (lower.includes("note")) {
                            autoMapping.notes = col;
                        }
                    });

                    setMapping(autoMapping);
                    toast.success(`Loaded ${data.length} rows from CSV`);
                }
            },
            error: (error) => {
                toast.error(`Failed to parse CSV: ${error.message}`);
            },
        });
    };

    const handleImport = async () => {
        if (!mapping.date || !mapping.amount || !mapping.description) {
            toast.error("Please map required fields: Date, Amount, and Description");
            return;
        }

        setImporting(true);
        setProgress(0);

        try {
            const transactions = csvData.map((row) => {
                // Parse amount
                let amount = parseFloat(row[mapping.amount]?.replace(/[^0-9.-]/g, "") || "0");

                // Determine type
                let type = "expense";
                if (mapping.type && row[mapping.type]) {
                    const typeValue = row[mapping.type].toLowerCase();
                    if (typeValue.includes("income") || typeValue.includes("credit") || typeValue.includes("deposit")) {
                        type = "income";
                    }
                }
                // Auto-detect from amount (negative = expense, positive = income)
                if (amount < 0) {
                    amount = Math.abs(amount);
                    type = "expense";
                }

                return {
                    date: row[mapping.date],
                    amount,
                    description: row[mapping.description] || "Imported Transaction",
                    type,
                    category: mapping.category ? row[mapping.category] : undefined,
                    notes: mapping.notes ? row[mapping.notes] : undefined,
                };
            });

            const response = await fetch("/api/transactions/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions, skipDuplicates }),
            });

            if (!response.ok) {
                throw new Error("Import failed");
            }

            const importResult: ImportResult = await response.json();
            setResult(importResult);
            setProgress(100);

            if (importResult.failed === 0) {
                toast.success(`Successfully imported ${importResult.imported} transactions!`);
            } else {
                toast.warning(
                    `Imported ${importResult.imported} transactions, ${importResult.failed} failed`
                );
            }
        } catch (error) {
            toast.error("Failed to import transactions");
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    const resetDialog = () => {
        setFile(null);
        setCsvData([]);
        setHeaders([]);
        setMapping({
            date: "",
            amount: "",
            description: "",
            type: "",
            category: "",
            notes: "",
        });
        setResult(null);
        setProgress(0);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetDialog();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Transactions from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file and map columns to import your transactions
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* File Upload */}
                    {!file && (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <Label htmlFor="csv-upload" className="cursor-pointer">
                                <div className="text-sm font-medium mb-2">
                                    Click to upload or drag and drop
                                </div>
                                <div className="text-xs text-muted-foreground">CSV files only</div>
                            </Label>
                            <Input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}

                    {/* File Info & Column Mapping */}
                    {file && csvData.length > 0 && !result && (
                        <>
                            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5" />
                                    <div>
                                        <div className="font-medium">{file.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {csvData.length} rows found
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={resetDialog}>
                                    Change File
                                </Button>
                            </div>

                            {/* Column Mapping */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Map CSV Columns</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>
                                            Date <span className="text-destructive">*</span>
                                        </Label>
                                        <Select value={mapping.date} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {headers.map((h) => (
                                                    <SelectItem key={h} value={h}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            Amount <span className="text-destructive">*</span>
                                        </Label>
                                        <Select value={mapping.amount} onValueChange={(v) => setMapping({ ...mapping, amount: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {headers.map((h) => (
                                                    <SelectItem key={h} value={h}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            Description <span className="text-destructive">*</span>
                                        </Label>
                                        <Select value={mapping.description} onValueChange={(v) => setMapping({ ...mapping, description: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {headers.map((h) => (
                                                    <SelectItem key={h} value={h}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Type (Optional)</Label>
                                        <Select value={mapping.type || "__none__"} onValueChange={(v) => setMapping({ ...mapping, type: v === "__none__" ? "" : v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">None</SelectItem>
                                                {headers.map((h) => (
                                                    <SelectItem key={h} value={h}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Category (Optional)</Label>
                                        <Select value={mapping.category || "__none__"} onValueChange={(v) => setMapping({ ...mapping, category: v === "__none__" ? "" : v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">None</SelectItem>
                                                {headers.map((h) => (
                                                    <SelectItem key={h} value={h}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Notes (Optional)</Label>
                                        <Select value={mapping.notes || "__none__"} onValueChange={(v) => setMapping({ ...mapping, notes: v === "__none__" ? "" : v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">None</SelectItem>
                                                {headers.map((h) => (
                                                    <SelectItem key={h} value={h}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="space-y-2">
                                    <Label>Preview (First 3 rows)</Label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-secondary">
                                                <tr>
                                                    <th className="p-2 text-left">Date</th>
                                                    <th className="p-2 text-left">Amount</th>
                                                    <th className="p-2 text-left">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvData.slice(0, 3).map((row, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="p-2">{mapping.date ? row[mapping.date] : "-"}</td>
                                                        <td className="p-2">{mapping.amount ? row[mapping.amount] : "-"}</td>
                                                        <td className="p-2">{mapping.description ? row[mapping.description] : "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Skip Duplicates</Label>
                                        <div className="text-xs text-muted-foreground">
                                            Skip transactions with same date, amount, and description
                                        </div>
                                    </div>
                                    <Switch checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Import Progress */}
                    {importing && (
                        <div className="space-y-2">
                            <Label>Importing...</Label>
                            <Progress value={progress} />
                        </div>
                    )}

                    {/* Import Results */}
                    {result && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Imported</span>
                                    </div>
                                    <div className="text-2xl font-bold">{result.imported}</div>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Skipped</span>
                                    </div>
                                    <div className="text-2xl font-bold">{result.skipped}</div>
                                </div>

                                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Failed</span>
                                    </div>
                                    <div className="text-2xl font-bold">{result.failed}</div>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Errors</Label>
                                    <div className="max-h-40 overflow-y-auto border rounded-lg p-4 space-y-2">
                                        {result.errors.slice(0, 10).map((err, i) => (
                                            <div key={i} className="text-sm">
                                                <span className="font-medium">Row {err.row}:</span>{" "}
                                                <span className="text-destructive">{err.error}</span>
                                            </div>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <div className="text-sm text-muted-foreground">
                                                And {result.errors.length - 10} more errors...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!file || importing || !mapping.date || !mapping.amount || !mapping.description}
                            >
                                {importing ? "Importing..." : "Import Transactions"}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => {
                            setOpen(false);
                            window.location.reload(); // Refresh to show new transactions
                        }}>
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

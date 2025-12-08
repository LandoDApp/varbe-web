"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { exportUserData, deleteUserData, anonymizeOrders } from "@/lib/dsgvo";
import { useTranslations } from 'next-intl';

export default function DataSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('settings.data');
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [exportData, setExportData] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push("/auth/login");
            return;
        }
    }, [user, authLoading, router]);

    const handleExportData = async () => {
        if (!user) return;
        
        setExporting(true);
        try {
            const data = await exportUserData(user.uid);
            const json = JSON.stringify(data, null, 2);
            setExportData(json);
            
            // Download as file
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `varbe-data-export-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            alert(`Fehler beim Exportieren: ${error.message}`);
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteData = async () => {
        if (!user) return;
        
        const confirmed = confirm(
            "⚠️ WARNUNG: Diese Aktion kann nicht rückgängig gemacht werden!\n\n" +
            "Alle deine Daten werden gelöscht:\n" +
            "- Profil\n" +
            "- Kunstwerke\n" +
            "- Nachrichten\n" +
            "- Gespeicherte Adressen\n\n" +
            "Bestellungen werden anonymisiert (für rechtliche Zwecke behalten).\n\n" +
            "Bist du sicher?"
        );

        if (!confirmed) return;

        const doubleConfirm = prompt(
            "Gib 'LÖSCHEN' ein, um zu bestätigen:"
        );

        if (doubleConfirm !== 'LÖSCHEN') {
            alert("Löschung abgebrochen.");
            return;
        }

        setDeleting(true);
        try {
            await anonymizeOrders(user.uid);
            await deleteUserData(user.uid);
            alert("Deine Daten wurden gelöscht. Du wirst jetzt abgemeldet.");
            router.push("/");
        } catch (error: any) {
            alert(`Fehler beim Löschen: ${error.message}`);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-5xl font-heading mb-8">{t('title')}</h1>
                <p className="font-body text-lg text-gray-700 mb-8">
                    {t('description')}
                </p>

                {/* Data Export */}
                <div className="card-comic bg-white border-4 border-black p-8 mb-8">
                    <h2 className="text-3xl font-heading mb-4">{t('export.title')}</h2>
                    <p className="font-body text-gray-700 mb-6">
                        {t('export.description')}
                    </p>
                    <Button
                        onClick={handleExportData}
                        disabled={exporting}
                        variant="accent"
                        className="w-full md:w-auto"
                    >
                        {exporting ? t('export.exporting') : t('export.exportButton')}
                    </Button>
                    {exportData && (
                        <div className="mt-4 p-4 bg-gray-100 border-2 border-black rounded">
                            <h3 className="font-heading mb-2">Exportierte Daten:</h3>
                            <pre className="text-xs overflow-auto max-h-64">
                                {exportData}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Data Deletion */}
                <div className="card-comic bg-red-50 border-4 border-red-500 p-8">
                    <h2 className="text-3xl font-heading mb-4 text-red-800">{t('delete.title')}</h2>
                    <p className="font-body text-red-700 mb-6">
                        {t('delete.description')}
                    </p>
                    <Button
                        onClick={handleDeleteData}
                        disabled={deleting}
                        variant="secondary"
                        className="bg-red-500 text-white hover:bg-red-600 w-full md:w-auto"
                    >
                        {deleting ? t('delete.deleting') : t('delete.button')}
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
}




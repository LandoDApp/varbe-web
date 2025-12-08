"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { seedJobs, SEED_JOBS } from "@/lib/jobs";
import { Link } from "@/i18n/routing";

export default function SeedJobsPage() {
    const [seeding, setSeeding] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSeed = async () => {
        setSeeding(true);
        setError(null);
        try {
            await seedJobs();
            setDone(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Fehler beim Seeden");
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black shadow-comic p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-heading mb-4">JOBS SEEDEN</h1>
                
                {!done ? (
                    <>
                        <p className="text-gray-600 mb-6">
                            Dies fügt {SEED_JOBS.length} Test-Jobs zur Datenbank hinzu.
                        </p>
                        
                        <div className="bg-gray-50 border-2 border-black p-4 mb-6 text-left text-sm">
                            <h3 className="font-bold mb-2">Jobs die erstellt werden:</h3>
                            <ul className="space-y-1">
                                {SEED_JOBS.map((job, i) => (
                                    <li key={i} className="text-gray-600">
                                        • {job.title} ({job.companyName})
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {error && (
                            <div className="bg-red-100 border-2 border-red-500 p-3 mb-4 text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                        
                        <Button 
                            variant="accent" 
                            onClick={handleSeed}
                            disabled={seeding}
                            className="w-full"
                        >
                            {seeding ? 'SEEDE...' : 'JOBS ERSTELLEN'}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-green-600 font-bold mb-6">
                            {SEED_JOBS.length} Jobs erfolgreich erstellt!
                        </p>
                        <Link href="/jobs">
                            <Button variant="accent" className="w-full">
                                ZUR JOBS-SEITE
                            </Button>
                        </Link>
                    </>
                )}
                
                <Link href="/jobs" className="block mt-4 text-gray-500 hover:text-black">
                    ← Zurück zu Jobs
                </Link>
            </div>
        </div>
    );
}




import { useMemo } from 'react';

function MedverseIntro({ closing = false }) {
    const letters = useMemo(() => ['M', 'E', 'D', 'V', 'E', 'R', 'S', 'E'], []);

    return (
        <div
            className={`medverse-intro fixed inset-0 z-50 flex items-center justify-center bg-slate-800 ${closing ? 'medverse-intro--fade' : ''}`}
        >
            <div className="flex flex-col items-center gap-6">
                <div className="flex gap-1 text-4xl font-semibold tracking-[0.28em] text-slate-100 sm:text-5xl">
                    {letters.map((letter, index) => (
                        <span
                            key={`${letter}-${index}`}
                            className="medverse-intro-letter"
                            style={{ animationDelay: `${index * 0.12}s` }}
                        >
                            {letter}
                        </span>
                    ))}
                </div>
                <div className="w-48 sm:w-64">
                    <div className="medverse-intro-bar" />
                </div>
                <p className="text-sm font-medium uppercase tracking-[0.4em] text-slate-400 sm:text-base">
                    Interactive ai medical textbook
                </p>
            </div>
        </div>
    );
}

export default MedverseIntro;

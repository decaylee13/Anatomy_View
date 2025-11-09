import { Link } from 'react-router-dom';

function MedverseNavbar() {
    return (
        <header className="fixed inset-x-0 top-6 z-40 flex justify-center">
            <div className="flex w-[min(90%,800px)] items-center justify-between rounded-full border border-white/20 bg-white/15 px-6 py-3 text-white shadow-lg backdrop-blur">
                <Link to="/" className="flex items-center gap-3 text-white">
                    <span className="text-sm font-semibold uppercase tracking-[0.4em] text-white/90">Medverse</span>
                </Link>
            </div>
        </header>
    );
}

export default MedverseNavbar;

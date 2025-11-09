import { Link } from 'react-router-dom';

function MedverseNavbar() {
    return (
        <header className="fixed inset-x-0 top-6 z-40 flex justify-center">
            <div className="flex w-[min(90%,800px)] items-center justify-between rounded-full border border-white/20 bg-white/15 px-6 py-3 text-white shadow-lg backdrop-blur">
                <Link to="/" className="flex items-center gap-3 text-white">
                    <span className="text-sm font-semibold uppercase tracking-[0.4em] text-white/90">Medverse</span>
                </Link>
                <form onSubmit={(event) => event.preventDefault()} className="ml-6 flex w-full max-w-xs items-center justify-end">
                    <label htmlFor="medverse-navbar-search" className="sr-only">
                        Search Medverse
                    </label>
                    <input
                        id="medverse-navbar-search"
                        type="search"
                        placeholder="Search chapters..."
                        className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/30 focus:bg-white/15 focus:placeholder-white/70"
                    />
                </form>
            </div>
        </header>
    );
}

export default MedverseNavbar;

interface ClassFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  gradeFilter: number | '';
  setGradeFilter: (value: number | '') => void;
  majorFilter: string;
  setMajorFilter: (value: string) => void;
  onSearch: () => void;
  isVisible: boolean;
}

export function ClassFilters({
  searchQuery,
  setSearchQuery,
  gradeFilter,
  setGradeFilter,
  majorFilter,
  setMajorFilter,
  onSearch,
  isVisible,
}: ClassFiltersProps) {
  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="bg-surface-card rounded-xl shadow-sm p-lg animate-in fade-in slide-in-from-top-2 duration-200">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-md">
        {/* Search */}
        <div className="md:col-span-2">
          <label
            htmlFor="search"
            className="block font-label-md text-label-md text-on-surface mb-xs"
          >
            Cari Kelas
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kelas..."
              className="w-full pl-xl pr-md py-sm bg-surface-container-low border-none rounded-lg font-body-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Grade Filter */}
        <div>
          <label
            htmlFor="grade"
            className="block font-label-md text-label-md text-on-surface mb-xs"
          >
            Tingkat
          </label>
          <select
            id="grade"
            value={gradeFilter}
            onChange={(e) =>
              setGradeFilter(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full px-md py-sm bg-surface-container-low border-none rounded-lg font-body-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Semua Tingkat</option>
            <option value="7">Kelas 7 (SMP)</option>
            <option value="8">Kelas 8 (SMP)</option>
            <option value="9">Kelas 9 (SMP)</option>
            <option value="10">Kelas 10 (SMA)</option>
            <option value="11">Kelas 11 (SMA)</option>
            <option value="12">Kelas 12 (SMA)</option>
          </select>
        </div>

        {/* Major Filter */}
        <div>
          <label
            htmlFor="major"
            className="block font-label-md text-label-md text-on-surface mb-xs"
          >
            Jurusan
          </label>
          <select
            id="major"
            value={majorFilter}
            onChange={(e) => setMajorFilter(e.target.value)}
            className="w-full px-md py-sm bg-surface-container-low border-none rounded-lg font-body-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Semua Jurusan</option>
            <option value="IPA">IPA</option>
            <option value="IPS">IPS</option>
            <option value="BAHASA">Bahasa</option>
          </select>
        </div>

        {/* Search Button (Mobile) */}
        <div className="md:col-span-4 flex justify-end gap-sm">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setGradeFilter('');
              setMajorFilter('');
              onSearch();
            }}
            className="h-10 px-md bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg flex items-center gap-xs hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Reset
          </button>
          <button
            type="submit"
            className="h-10 px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-xs hover:bg-surface-tint transition-all shadow-md hover:shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Cari
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { apiFetch } from '@/lib/apiFetch';
import { BACKEND_URL, GALLERY_CATEGORY_MAP } from '@/lib/constants';
import { X, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GalleryPage() {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // ── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/gallery?isActive=true')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers & Helpers ─────────────────────────────────────────────────────

  const translateCategory = (cat?: string) => {
    if (!cat) return 'Other';
    return GALLERY_CATEGORY_MAP[cat.toLowerCase()] || cat;
  };

  const categories = [
    'All',
    ...Array.from(new Set(items.map((i) => translateCategory(i.category)))),
  ];

  const filtered =
    activeCategory === 'All'
      ? items
      : items.filter((i) => translateCategory(i.category) === activeCategory);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white text-gray-900 pt-32 pb-20 px-4 border-b border-gray-100">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Our Gallery</h1>
            <div className="w-16 h-0.5 bg-red-800 mx-auto mb-6" />
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Explore our beautiful rooms, amenities, and surrounding landscapes.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Gallery List */}
      <section className="py-10 px-6 max-w-7xl mx-auto min-h-[50vh] mb-20">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
          </div>
        ) : (
          <>
            {categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as string)}
                    className={"px-6 py-2 text-xs uppercase tracking-widest transition-all duration-300 border font-bold " + (activeCategory === cat ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 bg-transparent')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-light text-xl border border-dashed border-gray-300">
                Gallery is currently empty.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] md:auto-rows-[300px] gap-4 md:gap-6">
                {filtered.slice(0, 6).map((item, index) => {
                  const isLarge = index % 6 === 1 || index % 6 === 3;
                  const spanClass = isLarge ? "col-span-1 md:col-span-2 row-span-1 md:row-span-2" : "col-span-1 row-span-1";

                  return (
                    <ScrollReveal key={item.id} className={spanClass}>
                      <div 
                        className="group relative bg-gray-200 w-full h-full rounded-sm overflow-hidden cursor-pointer shadow-sm"
                        onClick={() => setLightbox(item)}
                      >
                        <img
                          src={`${BACKEND_URL}${item.imageUrl}`}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6 text-center">
                          <ZoomIn className="text-white w-8 h-8 mb-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100" />
                          <h3 className="text-white font-sans font-bold text-xl tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-150">
                            {item.title}
                          </h3>
                          {item.category && (
                            <span className="text-gray-200 text-xs uppercase font-medium tracking-widest mt-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-200">
                              {translateCategory(item.category)}
                            </span>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
          >
            <X size={40} className="font-light" />
          </button>
          <div className="relative max-w-5xl w-full max-h-[85vh] flex flex-col">
            <img
              src={`${BACKEND_URL}${lightbox.imageUrl}`}
              alt={lightbox.title}
              className="w-full h-full object-contain"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white font-serif text-2xl mb-1">{lightbox.title}</h3>
              {lightbox.description && (
                <p className="text-gray-400 font-light text-sm">{lightbox.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

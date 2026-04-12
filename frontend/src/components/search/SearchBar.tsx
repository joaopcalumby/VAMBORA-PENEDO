"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";

const items = [
  { id: 1, title: "Penedo Centro", category: "Destino" },
  { id: 2, title: "Orla Ribeirinha", category: "Ponto Turístico" },
  { id: 3, title: "Rodoviária", category: "Transporte" },
  { id: 4, title: "Igreja da Corrente", category: "Histórico" },
];

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section ref={searchRef} className="mx-auto w-full max-w-md">
      <div className="group relative">
        <Search className="app-link-accent absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors group-focus-within:text-[#22ff95]" />

        <input
          type="text"
          placeholder="Para onde vamos?"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsOpen(true);
          }}
          className="app-bg-green-600 w-full rounded-2xl border border-gray-800 py-4 pl-12 pr-12 text-white transition-all focus:border-[#22ff95] focus:outline-none"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-800"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-800 bg-[#1a1a1a] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSearchQuery(item.title);
                    setIsOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-800 p-4 transition-colors hover:bg-[#222] last:border-none"
                >
                  <MapPin className="h-4 w-4 text-[#22ff95]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{item.title}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-gray-500">Nenhum local encontrado.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
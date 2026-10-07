import React from 'react';
import { ShoppingBag, ExternalLink, CheckCircle } from 'lucide-react';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  priceINR: number;
  retailer: string;
  inStock: boolean;
}

const SAMPLE_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Ergonomic Velvet Accent Chair', category: 'Seating', priceINR: 14999, retailer: 'Pepperfry', inStock: true },
  { id: '2', name: 'Warm Ambient Floor Lamp (3000K)', category: 'Lighting', priceINR: 4499, retailer: 'IKEA India', inStock: true },
  { id: '3', name: 'Solid Teak Wood Study Table', category: 'Tables', priceINR: 22500, retailer: 'Urban Ladder', inStock: true },
];

export const ShoppingList: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <span>Curated Material & Furniture Shopping List</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real prices in Indian Rupees (₹) (Preserved feature)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {SAMPLE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{item.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  {item.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vendor: <span className="text-slate-300 font-medium">{item.retailer}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-400">
                ₹{item.priceINR.toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 justify-end mt-0.5">
                <CheckCircle className="w-3 h-3" />
                <span>In Stock</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

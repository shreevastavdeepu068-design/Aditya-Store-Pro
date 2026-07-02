import { PageLayout } from "@/components/layout";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Search, MapPin, Mic, ScanLine, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: products, isLoading: prodsLoading } = useListProducts();

  return (
    <PageLayout>
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 rounded-b-3xl shadow-md sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center text-xs opacity-90 font-medium">
              <span>Delivering to</span>
            </div>
            <div className="flex items-center space-x-1 font-bold">
              <MapPin size={16} />
              <span>Tajpur Road, Sidhpura...</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border-2 border-white/40">
            A
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search for groceries..." 
              className="w-full bg-white text-foreground rounded-xl py-3 pl-10 pr-10 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Mic className="absolute right-3 top-1/2 -translate-y-1/2 text-primary cursor-pointer" size={18} />
          </div>
          <button className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30 text-white">
            <ScanLine size={20} />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-8 pb-24">
        {/* Flash Sale Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Flash Sale! ⚡
            </h3>
            <p className="text-sm opacity-90 mb-3">Get up to 50% off on daily essentials.</p>
            <div className="flex gap-2">
              <div className="bg-white/20 backdrop-blur-md rounded px-2 py-1 text-xs font-mono font-bold">02h</div>
              <div className="bg-white/20 backdrop-blur-md rounded px-2 py-1 text-xs font-mono font-bold">45m</div>
              <div className="bg-white/20 backdrop-blur-md rounded px-2 py-1 text-xs font-mono font-bold">10s</div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Categories */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold">Shop by Category</h2>
            <Link href="/categories"><span className="text-xs text-primary font-bold cursor-pointer">See All</span></Link>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 -mx-4 px-4">
            {catsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-20 flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-2xl"></div>
                  <div className="w-12 h-3 bg-muted rounded"></div>
                </div>
              ))
            ) : categories?.map((cat) => (
              <Link key={cat.id} href={`/categories?id=${cat.id}`}>
                <div className="flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center text-2xl group-hover:border-primary group-hover:shadow-md transition-all">
                    {cat.icon ? <img src={cat.icon} alt={cat.name} className="w-8 h-8 object-contain" /> : "🛒"}
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold">Best Sellers</h2>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 -mx-4 px-4">
            {prodsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-36 bg-card rounded-2xl p-3 border border-border shadow-sm animate-pulse">
                  <div className="w-full aspect-square bg-muted rounded-xl mb-2"></div>
                  <div className="h-4 bg-muted w-3/4 rounded mb-1"></div>
                  <div className="h-3 bg-muted w-1/2 rounded mb-3"></div>
                  <div className="h-8 bg-muted w-full rounded-lg"></div>
                </div>
              ))
            ) : products?.filter(p => p.isBestSeller).map((prod) => (
              <div key={prod.id} className="flex-shrink-0 w-[160px] bg-card rounded-2xl p-3 border border-border shadow-sm relative group flex flex-col">
                <div className="absolute top-2 left-2 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Bestseller
                </div>
                {prod.stock < (prod.lowStockThreshold || 5) && (
                  <div className="absolute top-2 right-2 z-10 bg-destructive text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Only {prod.stock} left
                  </div>
                )}
                <Link href={`/product/${prod.id}`}>
                  <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden bg-muted/30 p-2 cursor-pointer">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 flex flex-col">
                  <Link href={`/product/${prod.id}`}>
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 cursor-pointer">{prod.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-2">{prod.unit}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <span className="font-bold">₹{prod.price}</span>
                      {prod.mrp > prod.price && <span className="text-[10px] text-muted-foreground line-through ml-1">₹{prod.mrp}</span>}
                    </div>
                    <button className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

import { PageLayout } from "@/components/layout";
import { useListCategories } from "@workspace/api-client-react";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <PageLayout>
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold mb-6">All Categories</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {categories?.map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-full aspect-square bg-card rounded-2xl shadow-sm border border-border flex items-center justify-center text-3xl group-hover:border-primary group-hover:shadow-md transition-all p-4">
                  {cat.icon ? <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain" /> : "🛒"}
                </div>
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

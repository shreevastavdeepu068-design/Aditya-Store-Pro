import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";

const iconMap: Record<string, string> = {
  "Fruits & Vegetables": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200",
  "Dairy & Bakery": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200",
  "Atta, Rice & Dal": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200",
  "Masala & Oil": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200",
  "Snacks & Beverages": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200",
  "Personal Care": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=200",
  "Household Needs": "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200",
};

async function run() {
  for (const [name, icon] of Object.entries(iconMap)) {
    await db.update(categoriesTable).set({ icon }).where(eq(categoriesTable.name, name));
  }
  console.log("Updated category icons.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Add some sample landlords for testing
    const sampleLandlords = [
      {
        name: "Frederick Property Management",
        location: "Frederick, MD",
        address: "123 Main Street, Frederick, MD 21701"
      },
      {
        name: "Potomac Rentals LLC",
        location: "Frederick, MD", 
        address: "456 Market Street, Frederick, MD 21702"
      },
      {
        name: "Carroll Creek Properties",
        location: "Frederick, MD",
        address: "789 Baker Street, Frederick, MD 21703"
      }
    ];

    for (const landlordData of sampleLandlords) {
      try {
        await storage.createLandlord(landlordData);
        console.log(`Created landlord: ${landlordData.name}`);
      } catch (error) {
        // Landlord might already exist, continue
        console.log(`Landlord ${landlordData.name} already exists`);
      }
    }

    console.log("Database seeding completed");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
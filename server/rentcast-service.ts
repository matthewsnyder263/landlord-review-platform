import type { Landlord, InsertLandlord } from "@shared/schema";

interface RentCastProperty {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
}

interface RentCastResponse {
  properties: RentCastProperty[];
  count: number;
}

export class RentCastService {
  private apiKey: string;
  private baseUrl = "https://api.rentcast.io/v1";

  constructor() {
    this.apiKey = process.env.RENTCAST_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("RENTCAST_API_KEY environment variable is required");
    }
  }

  async searchProperties(query: string, location?: string): Promise<Landlord[]> {
    try {
      // Only make API call if we have meaningful search criteria
      if (!query && !location) {
        return [];
      }

      // Build search parameters
      const params = new URLSearchParams();
      params.set("limit", "50");
      
      if (location) {
        // Extract city and state from location
        const locationParts = location.split(",").map(part => part.trim());
        if (locationParts.length >= 2) {
          params.set("city", locationParts[0]);
          params.set("state", locationParts[1]);
        } else {
          // If just one part, assume it's a city and try common states
          params.set("city", locationParts[0]);
        }
      }
      
      if (query) {
        params.set("address", query);
      }

      const response = await fetch(
        `${this.baseUrl}/properties?${params.toString()}`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`RentCast API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: RentCastProperty[] = await response.json();
      
      // Convert RentCast properties to landlord records
      const landlords = this.convertPropertiesToLandlords(data);
      return landlords;

    } catch (error) {
      console.error("Error fetching from RentCast API:", error);
      return [];
    }
  }

  private convertPropertiesToLandlords(properties: RentCastProperty[]): Landlord[] {
    // Group properties by landlord/management company
    const landlordMap = new Map<string, {
      name: string;
      location: string;
      addresses: string[];
    }>();

    properties.forEach(property => {
      // Create area-based property management companies
      const landlordName = `${property.city} Property Management`;

      const location = `${property.city}, ${property.state}`;
      const address = property.formattedAddress;

      const key = `${landlordName.toLowerCase()}-${location.toLowerCase()}`;
      
      if (landlordMap.has(key)) {
        const existing = landlordMap.get(key)!;
        if (!existing.addresses.includes(address)) {
          existing.addresses.push(address);
        }
      } else {
        landlordMap.set(key, {
          name: landlordName,
          location: location,
          addresses: [address]
        });
      }
    });

    // Convert to Landlord objects
    const landlords: Landlord[] = [];
    let id = 1000; // Start with high ID to avoid conflicts with seeded data

    landlordMap.forEach(landlordData => {
      const landlord: Landlord = {
        id: id++,
        name: landlordData.name,
        location: landlordData.location,
        address: landlordData.addresses.length === 1 
          ? landlordData.addresses[0] 
          : `${landlordData.addresses.length} properties`,
        averageRating: null,
        totalReviews: 0,
        depositReturnRating: null,
        responsivenessRating: null,
        ethicsRating: null,
        maintenanceRating: null,
        communicationRating: null,
      };
      landlords.push(landlord);
    });

    return landlords;
  }

  async getPropertyDetails(propertyId: string): Promise<RentCastProperty | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/properties/${propertyId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching property details:", error);
      return null;
    }
  }
}

export const rentCastService = new RentCastService();
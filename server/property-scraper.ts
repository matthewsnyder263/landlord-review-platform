import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface PropertyOwnerInfo {
  ownerName: string;
  address: string;
  city: string;
  state: string;
  success: boolean;
  source?: string;
}

export class PropertyScraperService {
  private browser: any = null;

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Scrape NYC property data (NYC has excellent public records)
  async scrapeNYCProperty(address: string): Promise<PropertyOwnerInfo | null> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // NYC ACRIS property search
      await page.goto('https://a836-acris.nyc.gov/DS/DocumentSearch/BBL');
      
      // Search for the address
      await page.type('#txtPropertyAddress', address);
      await page.click('#btnSearch');
      
      // Wait for results
      await page.waitForSelector('.search-results', { timeout: 10000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract owner information from the results
      const ownerName = $('.owner-name').first().text().trim();
      
      await page.close();
      
      if (ownerName && ownerName !== '') {
        return {
          ownerName,
          address,
          city: 'New York',
          state: 'NY',
          success: true,
          source: 'NYC ACRIS'
        };
      }
      
      return null;
    } catch (error) {
      console.error('NYC scraping error:', error);
      return null;
    }
  }

  // Scrape Los Angeles County property data
  async scrapeLACountyProperty(address: string): Promise<PropertyOwnerInfo | null> {
    try {
      const response = await axios.get('https://portal.assessor.lacounty.gov/parceldetail', {
        params: {
          address: address
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const ownerName = $('#owner-name').text().trim();
      
      if (ownerName && ownerName !== '') {
        return {
          ownerName,
          address,
          city: 'Los Angeles',
          state: 'CA',
          success: true,
          source: 'LA County Assessor'
        };
      }
      
      return null;
    } catch (error) {
      console.error('LA County scraping error:', error);
      return null;
    }
  }

  // Scrape Cook County (Chicago) property data
  async scrapeCookCountyProperty(address: string): Promise<PropertyOwnerInfo | null> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.goto('https://www.cookcountyassessor.com/address-search');
      
      await page.type('#address-input', address);
      await page.click('#search-button');
      
      await page.waitForSelector('.property-details', { timeout: 10000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const ownerName = $('.owner-name').first().text().trim();
      
      await page.close();
      
      if (ownerName && ownerName !== '') {
        return {
          ownerName,
          address,
          city: 'Chicago',
          state: 'IL',
          success: true,
          source: 'Cook County Assessor'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Cook County scraping error:', error);
      return null;
    }
  }

  // Main method to get property owner by city/state
  async getPropertyOwner(address: string, city: string, state: string): Promise<PropertyOwnerInfo | null> {
    const normalizedCity = city.toLowerCase();
    const normalizedState = state.toLowerCase();
    
    try {
      // Route to appropriate scraper based on location
      if (normalizedState === 'ny' && normalizedCity.includes('new york')) {
        return await this.scrapeNYCProperty(address);
      } else if (normalizedState === 'ca' && normalizedCity.includes('los angeles')) {
        return await this.scrapeLACountyProperty(address);
      } else if (normalizedState === 'il' && normalizedCity.includes('chicago')) {
        return await this.scrapeCookCountyProperty(address);
      }
      
      // For other locations, try a generic approach using Google search
      return await this.scrapeGenericProperty(address, city, state);
      
    } catch (error) {
      console.error('Property scraping error:', error);
      return null;
    }
  }

  // Generic scraper for other locations
  private async scrapeGenericProperty(address: string, city: string, state: string): Promise<PropertyOwnerInfo | null> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Search for "[address] property owner [city] [state]"
      const searchQuery = `"${address}" property owner ${city} ${state}`;
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Look for property-related results
      const results = $('.g');
      let ownerName = '';
      
      results.each((i, element) => {
        const text = $(element).text().toLowerCase();
        if (text.includes('owner') || text.includes('property') || text.includes('landlord')) {
          // Extract potential owner name from the snippet
          const snippet = $(element).find('.VwiC3b').text();
          const ownerMatch = snippet.match(/owned by ([^,.\n]+)/i) || 
                           snippet.match(/owner:?\s*([^,.\n]+)/i) ||
                           snippet.match(/landlord:?\s*([^,.\n]+)/i);
          
          if (ownerMatch && ownerMatch[1]) {
            ownerName = ownerMatch[1].trim();
            return false; // Break the loop
          }
        }
      });
      
      await page.close();
      
      if (ownerName && ownerName !== '') {
        return {
          ownerName,
          address,
          city,
          state,
          success: true,
          source: 'Web Search'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Generic scraping error:', error);
      return null;
    }
  }
}

export const propertyScraperService = new PropertyScraperService();

// Cleanup on process exit
process.on('exit', async () => {
  await propertyScraperService.cleanup();
});

process.on('SIGINT', async () => {
  await propertyScraperService.cleanup();
  process.exit();
});

process.on('SIGTERM', async () => {
  await propertyScraperService.cleanup();
  process.exit();
});
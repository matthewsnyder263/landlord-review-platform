import { Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold text-primary mb-4">
              LandlordReviews
            </h2>
            <p className="text-text-secondary mb-4">
              Empowering tenants with honest landlord reviews to make informed rental decisions.
            </p>
            <div className="flex space-x-4">
              <Twitter className="w-5 h-5 text-text-secondary hover:text-primary cursor-pointer transition-colors" />
              <Facebook className="w-5 h-5 text-text-secondary hover:text-primary cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-text-secondary hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-4">For Tenants</h3>
            <ul className="space-y-2 text-text-secondary">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Write a Review
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Search Landlords
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Browse Reviews
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tenant Rights
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Support</h3>
            <ul className="space-y-2 text-text-secondary">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Report Content
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-text-secondary text-sm">
          <p>&copy; 2024 LandlordReviews. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}

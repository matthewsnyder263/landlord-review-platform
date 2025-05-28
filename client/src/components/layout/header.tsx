import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { User } from "lucide-react";

interface HeaderProps {
  onWriteReview: () => void;
}

export default function Header({ onWriteReview }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">
                  LandlordReviews
                </h1>
              </Link>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/">
                <a className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location === "/" 
                    ? "text-text-primary" 
                    : "text-text-secondary hover:text-primary"
                }`}>
                  Search
                </a>
              </Link>
              <Link href="/">
                <a className="text-text-secondary hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                  Browse Reviews
                </a>
              </Link>
              <a 
                href="#" 
                className="text-text-secondary hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                How It Works
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={onWriteReview}
              className="bg-primary text-white hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </Button>
            <button className="text-text-secondary hover:text-primary transition-colors">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

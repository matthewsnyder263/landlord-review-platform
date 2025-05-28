import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Check, Star } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for occasional renters",
      features: [
        "Browse landlord reviews",
        "Basic search functionality", 
        "View contact information",
        "Report issues"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Premium Tenant",
      price: "$9.99",
      period: "per month",
      description: "Advanced tools for serious renters",
      features: [
        "Everything in Free",
        "Advanced search filters",
        "Review alerts for your area",
        "Priority customer support",
        "Save favorite landlords",
        "Export review data"
      ],
      buttonText: "Start Premium",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Landlord Pro",
      price: "$29.99",
      period: "per month",
      description: "Professional tools for property owners",
      features: [
        "Respond to reviews",
        "Verified landlord badge",
        "Performance analytics",
        "Tenant inquiry management",
        "Priority listing placement",
        "Reputation monitoring"
      ],
      buttonText: "Go Professional",
      buttonVariant: "default" as const,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header onWriteReview={() => setIsReviewModalOpen(true)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Get the tools you need to make informed rental decisions or manage your properties effectively
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary border-2' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-text-primary mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-text-secondary">/{plan.period}</span>
                </div>
                <p className="text-text-secondary">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-text-primary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === "Free" ? (
                  <Link href="/">
                    <Button variant={plan.buttonVariant} className="w-full">
                      {plan.buttonText}
                    </Button>
                  </Link>
                ) : (
                  <Button variant={plan.buttonVariant} className="w-full">
                    {plan.buttonText}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-text-secondary">
                Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-text-secondary">
                We offer a 30-day money-back guarantee for all premium plans if you're not satisfied with the service.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-text-secondary">
                We accept all major credit cards, PayPal, and bank transfers through our secure payment processor.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Is my data secure?
              </h3>
              <p className="text-text-secondary">
                Yes, we use industry-standard encryption and security measures to protect your personal and payment information.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
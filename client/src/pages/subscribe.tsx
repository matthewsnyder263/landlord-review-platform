import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are now subscribed to " + plan + "!",
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe to ${plan}`
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Premium Tenant");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the plan from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan) {
      setSelectedPlan(plan);
    }

    // Create subscription intent
    apiRequest("POST", "/api/create-subscription", { plan: selectedPlan })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error creating subscription:', error);
        setIsLoading(false);
      });
  }, [selectedPlan]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Setup Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-text-secondary">
              Unable to set up subscription. Please try again later.
            </p>
            <Link href="/pricing">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/pricing">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Subscribe to {selectedPlan}
          </h1>
          <p className="text-text-secondary">
            Complete your payment to unlock premium features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Make SURE to wrap the form in <Elements> which provides the stripe context */}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm plan={selectedPlan} />
            </Elements>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-text-secondary">
          <p>Secure payment powered by Stripe</p>
          <p className="mt-2">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
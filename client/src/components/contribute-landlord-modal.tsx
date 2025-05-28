import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, AlertCircle } from "lucide-react";

interface ContributeLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlordId: number;
  currentAddress: string;
}

export default function ContributeLandlordModal({ 
  isOpen, 
  onClose, 
  landlordId,
  currentAddress
}: ContributeLandlordModalProps) {
  const [landlordName, setLandlordName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [howYouKnow, setHowYouKnow] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contributeMutation = useMutation({
    mutationFn: async (data: {
      landlordId: number;
      suggestedName: string;
      contactInfo?: string;
      howYouKnow: string;
    }) => {
      const response = await apiRequest("POST", "/api/contribute-landlord-name", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank You!",
        description: "Your contribution helps other tenants. We'll review and verify this information.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/landlords"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit contribution. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!landlordName.trim() || !howYouKnow.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the landlord name and how you know this information.",
        variant: "destructive",
      });
      return;
    }

    contributeMutation.mutate({
      landlordId,
      suggestedName: landlordName.trim(),
      contactInfo: contactInfo.trim() || undefined,
      howYouKnow: howYouKnow.trim()
    });
  };

  const handleClose = () => {
    setLandlordName("");
    setContactInfo("");
    setHowYouKnow("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            Help Other Tenants
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Property:</strong> {currentAddress}
              <br />
              <span className="text-blue-600">Know who actually owns or manages this property? Your help is valuable!</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="landlordName">Actual Landlord/Property Manager Name *</Label>
            <Input
              id="landlordName"
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
              placeholder="e.g., John Smith, ABC Property Management"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="contactInfo">Contact Information (Optional)</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone, email, or website (helps verify)"
            />
          </div>
          
          <div>
            <Label htmlFor="howYouKnow">How do you know this information? *</Label>
            <Textarea
              id="howYouKnow"
              value={howYouKnow}
              onChange={(e) => setHowYouKnow(e.target.value)}
              placeholder="e.g., I currently rent from them, I used to live there, I saw it on the lease..."
              rows={3}
              required
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <strong>Verification:</strong> We'll review all contributions to ensure accuracy. 
              Multiple confirmations help verify the information.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={contributeMutation.isPending}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {contributeMutation.isPending ? "Submitting..." : "Submit Contribution"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
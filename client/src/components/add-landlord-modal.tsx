import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin } from "lucide-react";

interface AddLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledAddress?: string;
  prefilledLocation?: string;
}

export default function AddLandlordModal({ 
  isOpen, 
  onClose, 
  prefilledAddress = "",
  prefilledLocation = ""
}: AddLandlordModalProps) {
  const [landlordName, setLandlordName] = useState("");
  const [address, setAddress] = useState(prefilledAddress);
  const [location, setLocation] = useState(prefilledLocation);
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLandlordMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      location: string;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/landlords", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Landlord information has been added to our database.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/landlords"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add landlord information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!landlordName.trim() || !address.trim() || !location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addLandlordMutation.mutate({
      name: landlordName.trim(),
      address: address.trim(),
      location: location.trim(),
      notes: notes.trim() || undefined
    });
  };

  const handleClose = () => {
    setLandlordName("");
    setAddress(prefilledAddress);
    setLocation(prefilledLocation);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Landlord Information
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="landlordName">Landlord/Property Manager Name *</Label>
            <Input
              id="landlordName"
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
              placeholder="Enter the actual landlord or management company name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address">Property Address *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Apt 2B"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="location">City, State *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New York, NY"
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this landlord or property..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addLandlordMutation.isPending}
              className="bg-primary text-white hover:bg-blue-700"
            >
              {addLandlordMutation.isPending ? "Adding..." : "Add Landlord"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
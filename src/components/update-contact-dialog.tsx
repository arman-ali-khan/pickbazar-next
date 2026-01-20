'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface UpdateContactDialogProps {
  currentContact: string;
  onUpdateContact: (newContact: string) => void;
}

export function UpdateContactDialog({ currentContact, onUpdateContact }: UpdateContactDialogProps) {
  const [contact, setContact] = useState(currentContact);
  const { toast } = useToast();

  const handleSubmit = () => {
    onUpdateContact(contact);
    toast({
        title: "Contact Updated",
        description: "Your contact number has been saved.",
    });
  };

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-xl text-center">Update Contact Number</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <Input 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            placeholder="+1 (936) 514-1641"
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button onClick={handleSubmit} className="w-full">Update Contact</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

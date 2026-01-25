'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { getDivisions, getDistricts, getUpazilas } from '@bangladeshi/bangladesh-address';

// This is the type expected by the parent component.
export type AddressFormValues = {
    type: 'billing' | 'shipping';
    title: string;
    country: string;
    city: string;
    state: string;
    zip: string;
    streetAddress: string;
}

// Internal form schema using BD address fields
const addressSchema = z.object({
  type: z.enum(['billing', 'shipping']),
  title: z.string().min(1, 'Title is required.'),
  division: z.string().min(1, 'Division is required.'),
  district: z.string().min(1, 'District is required.'),
  upazila: z.string().min(1, 'Upazila is required.'),
  zip: z.string().min(1, 'ZIP code is required.'),
  streetAddress: z.string().min(1, 'Street address is required.'),
});

interface AddAddressDialogProps {
  onAddAddress: (data: AddressFormValues) => void;
}

export function AddAddressDialog({ onAddAddress }: AddAddressDialogProps) {
  const [divisions, setDivisions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'shipping',
      title: '',
      division: '',
      district: '',
      upazila: '',
      zip: '',
      streetAddress: '',
    },
  });

  const selectedDivision = form.watch('division');
  const selectedDistrict = form.watch('district');

  useEffect(() => {
    setDivisions(getDivisions());
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      setDistricts(getDistricts(selectedDivision));
      form.setValue('district', '');
      form.setValue('upazila', '');
    } else {
      setDistricts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivision, form]);

  useEffect(() => {
    if (selectedDistrict) {
      setUpazilas(getUpazilas(selectedDistrict));
      form.setValue('upazila', '');
    } else {
      setUpazilas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, form]);

  // Transform internal form data to match the expected parent type
  function onSubmit(values: z.infer<typeof addressSchema>) {
    const dataToSubmit: AddressFormValues = {
        type: values.type,
        title: values.title,
        country: 'Bangladesh',
        state: values.division,
        city: values.district,
        zip: values.zip,
        streetAddress: `${values.streetAddress}, ${values.upazila}`,
    };
    onAddAddress(dataToSubmit);
    form.reset();
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-xl text-center">Add New Address</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="billing" />
                      </FormControl>
                      <FormLabel className="font-normal">Billing</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="shipping" />
                      </FormControl>
                      <FormLabel className="font-normal">Shipping</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Home, Office" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="division"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisions.map((div) => <SelectItem key={div} value={div}>{div}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDivision}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districts.map((dis) => <SelectItem key={dis} value={dis}>{dis}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="upazila"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upazila / Thana</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistrict}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Upazila" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {upazilas.map((upa) => <SelectItem key={upa} value={upa}>{upa}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 1216" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="e.g. House no, Road no" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
                <Button type="submit" className="w-full">Save Address</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

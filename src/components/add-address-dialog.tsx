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
import { useMemo, useState } from 'react';
import { divisions, districts, upazilas } from 'bd-geodata';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export type AddressFormValues = {
    type: 'billing' | 'shipping';
    title: string;
    country: string;
    city: string;
    state: string;
    zip: string;
    streetAddress: string;
}

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping']),
  title: z.string().min(1, 'Title is required.'),
  division: z.string({ required_error: 'Division is required.' }).min(1, 'Division is required.'),
  district: z.string({ required_error: 'District is required.' }).min(1, 'District is required.'),
  upazila: z.string({ required_error: 'Upazila/Thana is required.' }).min(1, 'Upazila/Thana is required.'),
  zip: z.string().min(1, 'ZIP code is required.'),
  streetAddress: z.string().min(1, 'Street address is required.'),
});

interface AddAddressDialogProps {
  onAddAddress: (data: AddressFormValues) => void;
}

export function AddAddressDialog({ onAddAddress }: AddAddressDialogProps) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'shipping',
      title: '',
      zip: '',
      streetAddress: '',
    },
  });

  const filteredDistricts = useMemo(() => {
    if (!selectedDivisionId) return [];
    return districts.filter(d => d.division_id === selectedDivisionId);
  }, [selectedDivisionId]);

  const filteredUpazilas = useMemo(() => {
    if (!selectedDistrictId) return [];
    return upazilas.filter(u => u.district_id === selectedDistrictId);
  }, [selectedDistrictId]);


  function onSubmit(values: z.infer<typeof addressSchema>) {
    const divisionName = divisions.find(d => d.id === values.division)?.name || '';
    const districtName = districts.find(d => d.id === values.district)?.name || '';
    const upazilaName = upazilas.find(u => u.id === values.upazila)?.name || '';

    onAddAddress({
      type: values.type,
      title: values.title,
      country: 'Bangladesh',
      state: divisionName,
      city: districtName,
      zip: values.zip,
      streetAddress: `${values.streetAddress}, ${upazilaName}`,
    });
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
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedDivisionId(value);
                      form.setValue('district', '');
                      form.setValue('upazila', '');
                      setSelectedDistrictId(null);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisions.map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))}
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
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedDistrictId(value);
                      form.setValue('upazila', '');
                    }}
                    value={field.value}
                    disabled={!selectedDivisionId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredDistricts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistrictId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select upazila/thana" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredUpazilas.map((upazila) => (
                        <SelectItem key={upazila.id} value={upazila.id}>
                          {upazila.name}
                        </SelectItem>
                      ))}
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
                  <FormLabel>ZIP Code</FormLabel>
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
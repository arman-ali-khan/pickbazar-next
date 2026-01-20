import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function HeroBanners() {
  return (
    <section className="container py-8 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[#E3F2FD] p-8 rounded-lg relative overflow-hidden text-gray-800 flex items-center h-[180px]">
            <div>
              <h2 className="text-2xl font-bold mb-1">Express Delivery</h2>
              <p className="text-sm mb-4">With selected items</p>
              <Button variant="outline" className="bg-white border-white text-gray-700">Save Now</Button>
            </div>
            <Image src="https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/express-delivery.svg" alt="Express Delivery" width={160} height={100} className="absolute right-0 bottom-0" />
        </div>
        <div className="bg-[#E8F5E9] p-8 rounded-lg relative overflow-hidden text-gray-800 flex items-center h-[180px]">
            <div>
              <h2 className="text-2xl font-bold mb-1">Cash On Delivery</h2>
              <p className="text-sm mb-4">With selected items</p>
              <Button variant="outline" className="bg-white border-white text-gray-700">Save Now</Button>
            </div>
            <Image src="https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/cod.svg" alt="Cash on Delivery" width={192} height={100} className="absolute right-0 bottom-0" />
        </div>
        <div className="bg-[#F3E5F5] p-8 rounded-lg relative overflow-hidden text-gray-800 flex items-center h-[180px]">
            <div>
              <h2 className="text-2xl font-bold mb-1">Gift Voucher</h2>
              <p className="text-sm mb-4">With personal care items</p>
              <Button variant="outline" className="bg-white border-white text-gray-700">Shop Coupons</Button>
            </div>
            <Image src="https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/gift-voucher.svg" alt="Gift Voucher" width={128} height={100} className="absolute right-4 bottom-4" />
        </div>
      </div>
       <Button variant="outline" size="icon" className="absolute top-1/2 -right-0 -translate-y-1/2 rounded-full bg-white shadow-md hidden md:flex">
          <ChevronRight className="h-4 w-4" />
        </Button>
    </section>
  );
}

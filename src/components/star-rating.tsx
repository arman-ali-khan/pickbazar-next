import { ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";

export default function CartButton() {
    return (
        <div className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
            <Button className="h-auto p-0 flex flex-col gap-0 rounded-l-md rounded-r-none shadow-lg">
                <div className="flex items-center gap-2 px-3 py-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-sm font-medium">2 Items</span>
                </div>
                <div className="bg-white text-primary rounded-md w-full py-1 px-4 text-sm font-bold m-1">
                    $3.71
                </div>
            </Button>
        </div>
    )
}

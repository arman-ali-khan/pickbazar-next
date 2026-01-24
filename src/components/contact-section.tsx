import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ContactSection() {
  return (
    <div className="bg-muted/30 p-8 rounded-lg flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
        <p className="max-w-md mx-auto mb-8 text-muted-foreground">
            Can't find the answer you're looking for? Please chat to our friendly team.
        </p>
        <Button asChild size="lg">
            <Link href="/contact">Get in touch</Link>
        </Button>
    </div>
  )
}

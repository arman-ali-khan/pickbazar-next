'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const teamMembers = [
  {
    name: 'John Doe',
    role: 'CEO & Founder',
    avatar: { src: 'https://picsum.photos/seed/ceo/200/200', hint: 'man smiling' },
    bio: 'John is passionate about bringing fresh, local produce to every household. His vision drives our mission.',
    social: { linkedin: '#', twitter: '#' },
  },
  {
    name: 'Jane Smith',
    role: 'Head of Operations',
    avatar: { src: 'https://picsum.photos/seed/coo/200/200', hint: 'woman portrait' },
    bio: 'Jane ensures that from farm to your door, every step is seamless, efficient, and meets our quality standards.',
    social: { linkedin: '#', twitter: '#' },
  },
  {
    name: 'Peter Jones',
    role: 'Lead Developer',
    avatar: { src: 'https://picsum.photos/seed/dev/200/200', hint: 'man glasses' },
    bio: 'Peter is the mastermind behind our user-friendly platform, constantly innovating to improve your shopping experience.',
    social: { linkedin: '#', twitter: '#' },
  },
];

export default function AboutPage() {
  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">About Pickbazar</h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-3xl mx-auto">
            We are a team of passionate food lovers dedicated to bringing the freshest groceries right to your doorstep.
          </p>
        </section>

        <section className="mb-16">
          <div className="relative h-96 w-full rounded-lg overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RvcmV8ZW58MHx8fHwxNzcyNTU4NTUxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Our mission"
              data-ai-hint="grocery store aisle"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="max-w-2xl mx-auto">
                  To provide our customers with the highest quality, freshest products sourced from local farms and trusted suppliers, all while offering a convenient and delightful shopping experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center">
                <CardHeader>
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar.src} alt={member.name} data-ai-hint={member.avatar.hint} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle>{member.name}</CardTitle>
                  <p className="text-primary font-semibold">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{member.bio}</p>
                  <div className="flex justify-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={member.social.linkedin}><Linkedin className="h-5 w-5 text-muted-foreground" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={member.social.twitter}><Twitter className="h-5 w-5 text-muted-foreground" /></a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

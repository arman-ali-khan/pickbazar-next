import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json({ message: 'Email and full name are required.' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }

    const newUser = new User({
      email,
      fullName,
    });

    await newUser.save();

    return NextResponse.json({ message: 'User registered successfully.', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'An error occurred during registration.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
  }
}

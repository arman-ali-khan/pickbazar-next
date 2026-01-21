import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json({ message: 'Email and full name are required.' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists in our database.' }, { status: 409 });
    }

    const newUser = new User({
      email,
      fullName,
    });

    await newUser.save();

    return NextResponse.json({ message: 'User registered successfully.', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Registration API Error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ message: 'User data validation failed.', error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message.includes('connect ECONNREFUSED') || error.message.includes('timed out')) {
         return NextResponse.json({ message: 'Could not connect to the database. Please check your connection string and firewall settings.' }, { status: 500 });
      }
      return NextResponse.json({ message: 'An error occurred during registration.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown server error occurred.' }, { status: 500 });
  }
}

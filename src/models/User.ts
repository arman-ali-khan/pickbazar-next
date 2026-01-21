import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  fullName: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent model overwrite during hot-reloading in development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  googleId?: string;
  microsoftId?: string;
  emailVerified?: Date;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  microsoftAccessToken?: string;
  microsoftRefreshToken?: string;
  microsoftTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    microsoftId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerified: {
      type: Date,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
    },
    microsoftAccessToken: {
      type: String,
    },
    microsoftRefreshToken: {
      type: String,
    },
    microsoftTokenExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are already created by unique: true in schema definition

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
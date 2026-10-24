import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET || "touroholic-jwt-super-secret-key-change-in-production";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("touroholic_session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

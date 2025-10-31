import { jwtVerify } from "jose";
import { cookies } from "next/headers";

interface JwtPayload {
  name: string;
  email: string;
  role: string;
  institution?: string;
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function getUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);

    // ✅ Safe 2-step cast: JWTPayload → unknown → JwtPayload
    const typedPayload = payload as unknown as JwtPayload;

    return typedPayload; // will contain name, email, role, institution, etc.
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

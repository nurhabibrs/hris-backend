export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  photo_url: string | null;
  role: string;
}

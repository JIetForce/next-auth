export type Viewer = Readonly<{
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: boolean;
}>;

import { signInWithGoogle } from "../actions";
import { GoogleSignInButton } from "./google-sign-in-button";

export function GoogleSignInForm({ configured }: { configured: boolean }) {
  return (
    <form action={signInWithGoogle}>
      <GoogleSignInButton disabled={!configured} />
    </form>
  );
}

import { useRouter } from 'next/router';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>{error || 'An error occurred during authentication'}</p>
      <button onClick={() => router.push('/auth/signin')}>
        Go to Sign In
      </button>
    </div>
  );
}

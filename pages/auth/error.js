import { useRouter } from 'next/router'

export default function Error() {
  const router = useRouter()
  const { error } = router.query

  return (
    <div>
      <h1>An error occurred</h1>
      <p>{error}</p>
    </div>
  )
}

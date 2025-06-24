// src/app/stations/[slug]/page.tsx
import { notFound } from 'next/navigation'
import StationPage from '@/components/StationPage'   // ← {} を外す
import { stations } from '@/lib/stations'

interface StationPageProps {
  params: { slug: string }
}

export default function Station({ params }: StationPageProps) {
  const station = stations[params.slug]
  if (!station) notFound()
  return <StationPage station={station} />
}

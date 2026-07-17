'use client'

import { redirect } from 'next/navigation'

export default function AptitudeRedirect() {
  redirect('/subjects?subject=aptitude')
}

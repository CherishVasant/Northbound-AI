'use client'

import { redirect } from 'next/navigation'

export default function CertificationsRedirect() {
  redirect('/prep?tab=certifications')
}

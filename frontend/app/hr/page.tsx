'use client'

import { redirect } from 'next/navigation'

export default function HRRedirect() {
  redirect('/prep?tab=hr')
}

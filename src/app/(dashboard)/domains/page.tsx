import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DOMAINS } from '@/lib/domains'
import { DomainsClient } from './domains-client'
import type { UserDomain, Domain } from '@/types'

export default async function DomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('user_domains')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  const userDomains = (data as UserDomain[]) ?? []
  const customSlugs = new Set(userDomains.map((ud) => ud.slug))
  const userMapped: Domain[] = userDomains.map((ud) => ({
    slug: ud.slug,
    nameHe: ud.name,
    nameEn: ud.name,
    icon: ud.icon,
    color: ud.color,
    gradient: '',
    glowColor: `${ud.color}33`,
  }))
  const activeDomains: Domain[] = userDomains.length > 0
    ? [...userMapped, ...DOMAINS.filter((d) => !customSlugs.has(d.slug))]
    : DOMAINS

  return (
    <DomainsClient
      userId={user.id}
      domains={activeDomains}
      hasCustomDomains={userDomains.length > 0}
      customDomainSlugs={[...customSlugs]}
    />
  )
}

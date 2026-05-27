export function DashboardMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-md mx-auto pb-24 md:max-w-none md:mx-0 md:ps-72 md:pb-8">
      <div className="md:max-w-6xl md:mx-auto md:px-8">{children}</div>
    </main>
  )
}

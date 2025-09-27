export default function Homepage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4" data-testid="text-homepage-title">
        Homepage
      </h1>
      <div className="text-muted-foreground" data-testid="text-homepage-content">
        Esta página está em branco conforme solicitado.
      </div>
    </div>
  )
}
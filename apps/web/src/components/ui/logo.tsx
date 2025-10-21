export function Logo() {
  return (
    <div className="flex items-center space-x-3">
      {/* Light mode logo */}
      <img 
        src="/logo-light.png" 
        alt="Wessley AI" 
        className="h-12 dark:hidden"
      />
      {/* Dark mode logo */}
      <img 
        src="/logo-dark.png" 
        alt="Wessley AI" 
        className="h-12 hidden dark:block"
      />
      <span className="keania-one-regular tracking-wide" style={{color: '#22E974', fontSize: '42px'}}>
        WESSLEY AI
      </span>
    </div>
  )
}
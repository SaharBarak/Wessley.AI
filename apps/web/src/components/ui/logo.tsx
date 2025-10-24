import Image from "next/image"

export function Logo() {
  return (
    <div className="flex items-center space-x-3">
      {/* Light mode logo */}
      <Image 
        src="/logo-light.svg" 
        alt="Wessley AI" 
        width={48}
        height={48}
        className="h-12 w-auto dark:hidden"
      />
      {/* Dark mode logo */}
      <Image 
        src="/logo-dark.svg" 
        alt="Wessley AI" 
        width={48}
        height={48}
        className="h-12 w-auto hidden dark:block"
      />
      <span className="keania-one-regular tracking-wide" style={{color: '#22E974', fontSize: '42px'}}>
        WESSLEY AI
      </span>
    </div>
  )
}
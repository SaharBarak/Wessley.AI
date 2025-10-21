import { FC } from "react"

interface LoadingProps {}

const Loading: FC<LoadingProps> = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default Loading
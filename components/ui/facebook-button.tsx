import { Button } from "@/components/ui/button"

export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  )
}

export function FacebookButton({ onClick, children = "Facebook Login" }: { onClick?: () => void; children?: React.ReactNode }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="group w-full h-11 gap-3 border border-border bg-background hover:bg-muted text-foreground hover:text-foreground rounded-lg hover:shadow-md transition-all duration-200 font-medium"
    >
      <FacebookIcon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{children}</span>
    </Button>
  )
}

import { CategoryPanel } from '@/components/CategoryPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KINDS } from '@/lib/kinds'

/** Tabs below `lg`; all three panels side by side at `lg` and up. */
export function CategoriesPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <Tabs defaultValue={KINDS[0].kind}>
        <TabsList className="lg:hidden">
          {KINDS.map((k) => (
            <TabsTrigger key={k.kind} value={k.kind}>
              {k.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-4 grid items-start gap-4 lg:mt-0 lg:grid-cols-3">
          {KINDS.map((k) => (
            <TabsContent
              key={k.kind}
              value={k.kind}
              forceMount
              className="data-[state=inactive]:hidden lg:data-[state=inactive]:block"
            >
              <CategoryPanel kind={k} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}

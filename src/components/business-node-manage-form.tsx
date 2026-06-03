"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Briefcase } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBusinessNodes } from "@/hooks/use-business-nodes"
import { AppleSwitch } from "@/components/unlumen-ui/apple-switch"

const formSchema = z.object({
  name: z.string().min(1, { message: "Business Node name is required." }),
  type: z.string().min(1, { message: "Type is required." }),
  parentNodeId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

interface BusinessNodeManageFormProps {
  initialValues?: {
    id: string
    name: string
    type: string
    parentNodeId?: string | null
    isActive?: boolean
  }
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
}

export function BusinessNodeManageForm({ initialValues, onSubmit: onSubmitProp }: BusinessNodeManageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { businessNodes, isLoading } = useBusinessNodes()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      type: initialValues?.type || "",
      parentNodeId: initialValues?.parentNodeId || null,
      isActive: initialValues?.isActive ?? true,
    },
  })

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name,
        type: initialValues.type,
        parentNodeId: initialValues.parentNodeId || null,
        isActive: initialValues.isActive ?? true,
      })
    }
  }, [initialValues, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await onSubmitProp({
        ...values,
        parentNodeId: values.parentNodeId === "none" ? null : values.parentNodeId
      })
      router.push("/business-nodes")
    } catch (error) {
      // Handled globally
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out the current node from being its own parent to prevent circular reference
  const availableParents = businessNodes.filter(n => n.id !== initialValues?.id)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={() => router.push("/business-nodes")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {initialValues ? "Edit Business Node" : "Create New Business Node"}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure hierarchy and type for this organization node.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/business-nodes")}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Business Node"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 font-bold">Node Name <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Acme Corp, Branch A" {...field} className="rounded-xl focus-visible:ring-primary/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 font-bold">Node Type <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder="Select node type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentNodeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 font-bold">Parent Node</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || undefined} 
                  value={field.value || "none"}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder={isLoading ? "Loading..." : "Select parent (Optional)"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">No Parent (Root Node)</SelectItem>
                    {availableParents.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({node.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {initialValues && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 shadow-sm bg-slate-50/50 mt-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-bold text-zinc-800">
                      Active Status
                    </FormLabel>
                    <p className="text-xs text-zinc-500">
                      Determines if this node can be used in the system
                    </p>
                  </div>
                  <FormControl>
                    <AppleSwitch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      </form>
    </Form>
  )
}

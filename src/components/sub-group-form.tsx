"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
import { useGroups } from "@/hooks/use-groups"

const formSchema = z.object({
  group: z.string().min(1, {
    message: "Please select a group.",
  }),
  subGroup: z.string().min(1, {
    message: "Sub group name is required.",
  }),
  status: z.string().min(1, {
    message: "Please select a status.",
  }),
})

interface SubGroupFormProps {
  onSuccess?: () => void
  initialValues?: Partial<z.infer<typeof formSchema>>
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
}

export function SubGroupForm({ onSuccess, initialValues, onSubmit: onSubmitProp }: SubGroupFormProps) {
  const { groups, refetch: fetchGroups } = useGroups(!!initialValues?.group)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group: initialValues?.group || "",
      subGroup: initialValues?.subGroup || "",
      status: initialValues?.status || "Active",
    },
  })

  useEffect(() => {
    if (initialValues) {
      form.reset({
        ...form.getValues(),
        ...initialValues,
      })
    } else {
      form.reset({
        group: "",
        subGroup: "",
        status: "Active",
      })
    }
  }, [initialValues, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await onSubmitProp(values)
      onSuccess?.()
    } catch (error) {
      // Handled by custom hook / api client
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="group"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Group <span className="text-destructive">*</span></FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                onOpenChange={(open) => {
                  if (open) {
                    fetchGroups()
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groups.length === 0 ? (
                    <div className="py-2 px-3 text-xs text-zinc-500">
                      No groups available. Please create a group first.
                    </div>
                  ) : (
                    groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sub Group Name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Enter sub group name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={onSuccess} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Sub Group"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

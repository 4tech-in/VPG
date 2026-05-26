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

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Organization name is required.",
  }),
  industryType: z.string().optional().nullable(),
  email: z.string().email({ message: "Invalid email format." }).or(z.literal("")).optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

interface OrganizationFormProps {
  onSuccess?: () => void
  initialValues?: Partial<z.infer<typeof formSchema>>
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
}

export function OrganizationForm({ onSuccess, initialValues, onSubmit: onSubmitProp }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      industryType: initialValues?.industryType || "",
      email: initialValues?.email || "",
      mobile: initialValues?.mobile || "",
      address: initialValues?.address || "",
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
        name: "",
        industryType: "",
        email: "",
        mobile: "",
        address: "",
      })
    }
  }, [initialValues, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await onSubmitProp(values)
      onSuccess?.()
    } catch (error) {
      // Error handled in hook/api-client
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Enter organization name" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="industryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g. IT, Healthcare, Finance" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="org@example.com" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone/mobile number" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter physical address" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={onSuccess} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Organization"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

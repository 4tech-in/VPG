"use client"

import { useEffect } from "react"
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
}

export function SubGroupForm({ onSuccess, initialValues }: SubGroupFormProps) {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    onSuccess?.()
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="gadgets">Gadgets</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            Save Sub Group
          </Button>
        </div>
      </form>
    </Form>
  )
}

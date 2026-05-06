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
  name: z.string().min(1, {
    message: "Category name is required.",
  }),
  groups: z.string().min(1, {
    message: "Please select at least one group.",
  }),
})

interface CategoryFormProps {
  onSuccess?: () => void
  initialValues?: Partial<z.infer<typeof formSchema>>
}

export function CategoryForm({ onSuccess, initialValues }: CategoryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      groups: initialValues?.groups || "",
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
        groups: "",
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="groups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associate Groups <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select groups" />
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
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            Save Category
          </Button>
        </div>
      </form>
    </Form>
  )
}

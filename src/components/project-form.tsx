"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Country, State, City } from "country-state-city"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  startDate: z.date({ message: "Start date is required" }),
  status: z.string().min(1, "Status is required"),
  projectNotes: z.string().optional(),
})

interface ProjectFormProps {
  onSuccess?: () => void
  initialValues?: any
  onSubmit?: (values: any) => Promise<void>
}

export function ProjectForm({ onSuccess, initialValues, onSubmit: onSubmitProp }: ProjectFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(initialValues?.country || "")
  const [selectedState, setSelectedState] = useState<string>(initialValues?.state || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: initialValues?.projectName || "",
      streetAddress: initialValues?.streetAddress || "",
      country: initialValues?.country || "",
      state: initialValues?.state || "",
      city: initialValues?.city || "",
      postalCode: initialValues?.postalCode || "",
      status: initialValues?.status || "Active",
      projectNotes: initialValues?.projectNotes || "",
      startDate: initialValues?.startDate || undefined,
    },
  })

  // Synchronize internal state and form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setSelectedCountry(initialValues.country || "")
      setSelectedState(initialValues.state || "")
      form.reset({
        ...form.getValues(),
        ...initialValues,
      })
    } else {
      setSelectedCountry("")
      setSelectedState("")
      form.reset({
        projectName: "",
        streetAddress: "",
        country: "",
        state: "",
        city: "",
        postalCode: "",
        status: "Active",
        projectNotes: "",
      })
    }
  }, [initialValues, form])

  const allCountries = Country.getAllCountries()
  const allStates = selectedCountry ? State.getStatesOfCountry(selectedCountry) : []
  const allCities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : []

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const addressPayload = JSON.stringify({
        streetAddress: values.streetAddress,
        city: values.city,
        state: values.state,
        country: values.country,
        postalCode: values.postalCode,
      })
      const payload = {
        projectName: values.projectName,
        address: addressPayload,
        startDate: values.startDate,
        notes: values.projectNotes || "",
        status: values.status === "Active" ? "active" : "inactive" as any,
        file: selectedFile || undefined,
      }
      await onSubmitProp?.(payload)
      onSuccess?.()
    } catch (error) {
      // Handled in hooks
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        
        {/* Row 1: Project Name + Street Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Enter project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Enter street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Country, State, City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val)
                      setSelectedCountry(val)
                      setSelectedState("")
                      form.setValue("state", "")
                      form.setValue("city", "")
                    }}
                    value={field.value || ""}
                  >
                    <option value="">Select country</option>
                    {allCountries.map((country) => (
                      <option key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val)
                      setSelectedState(val)
                      form.setValue("city", "")
                    }}
                    value={field.value || ""}
                    disabled={!selectedCountry}
                  >
                    <option value="">Select state</option>
                    {allStates.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={field.onChange}
                    value={field.value || ""}
                    disabled={!selectedState}
                  >
                    <option value="">Select city</option>
                    {allCities.map((city) => (
                      <option key={`${city.name}-${city.latitude}`} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: Postal Code + Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Enter postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const dateStr = e.target.value
                      field.onChange(dateStr ? new Date(dateStr) : undefined)
                    }}
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={field.onChange}
                  value={field.value || ""}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project Notes */}
        <FormField
          control={form.control}
          name="projectNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional project notes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-600">Project File / Document (optional)</label>
          <Input 
            type="file" 
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null
              setSelectedFile(selectedFile)
            }}
            className="h-10 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {initialValues?.file && (
            <div className="text-xs text-zinc-500 mt-1">
              Current File:{" "}
              <a 
                href={`${process.env.NEXT_PUBLIC_BASE_URL?.split('/api')[0] || ''}${initialValues.file}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary font-bold hover:underline"
              >
                {initialValues.file.split("/").pop()}
              </a>
            </div>
          )}
        </div>


        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={onSuccess} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Project"}
          </Button>
        </div>
      </form>
    </Form>
  )
}


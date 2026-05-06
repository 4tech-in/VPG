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
  initialValues?: Partial<z.infer<typeof formSchema>>
}

export function ProjectForm({ onSuccess, initialValues }: ProjectFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(initialValues?.country || "")
  const [selectedState, setSelectedState] = useState<string>(initialValues?.state || "")

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    onSuccess?.()
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
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedCountry(value)
                    setSelectedState("")
                    form.setValue("state", "")
                    form.setValue("city", "")
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {allCountries.map((country) => (
                      <SelectItem key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedState(value)
                    form.setValue("city", "")
                  }}
                  value={field.value}
                  disabled={!selectedCountry}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {allStates.map((state) => (
                      <SelectItem key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedState}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {allCities.map((city) => (
                      <SelectItem key={`${city.name}-${city.latitude}`} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FormLabel className="mb-1">Start Date <span className="text-destructive">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">Save Project</Button>
        </div>
      </form>
    </Form>
  )
}

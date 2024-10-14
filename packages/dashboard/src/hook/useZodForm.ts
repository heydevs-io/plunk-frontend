import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z, ZodType } from "zod";
import type { FirstParams } from "../models/utility.types";

export const useZodForm = <T extends ZodType>(
  schema: T,
  props?: FirstParams<typeof useForm<z.infer<T>>>
) =>
  useForm({
    ...props,
    resolver: zodResolver(schema),
  });

import { format, parseISO } from "date-fns";

export default function formatDate(date: string, short: boolean = false) {
  return format(parseISO(date), short ? "MMM dd, yyyy" : "MMMM do, yyyy");
}

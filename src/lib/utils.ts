// Indian States with their GST state codes
export const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman & Diu" },
  { code: "26", name: "Dadra & Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

// Format currency in INR
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format number with Indian grouping (no currency symbol)
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Convert number to words (for invoice amounts)
export function numberToWords(num: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function helper(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + helper(n % 10);
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + helper(n % 100);
    if (n < 100000) return helper(Math.floor(n / 1000)) + "Thousand " + helper(n % 1000);
    if (n < 10000000) return helper(Math.floor(n / 100000)) + "Lakh " + helper(n % 100000);
    return helper(Math.floor(n / 10000000)) + "Crore " + helper(n % 10000000);
  }

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);
  let result = helper(intPart).trim();
  if (decPart > 0) result += ` and ${helper(decPart).trim()} Paise`;
  return (num < 0 ? "Minus " : "") + result + " Only";
}

// Validate GSTIN format
export function validateGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

// Determine if transaction is inter-state
export function isInterState(supplierStateCode: string, buyerStateCode: string): boolean {
  return supplierStateCode !== buyerStateCode;
}

// Calculate GST amounts for a line item
export function calculateGST(
  amount: number,
  gstRate: number,
  cgstRate: number,
  sgstRate: number,
  igstRate: number,
  interState: boolean
): { cgst: number; sgst: number; igst: number; total: number } {
  if (interState) {
    const igst = (amount * igstRate) / 100;
    return { cgst: 0, sgst: 0, igst, total: igst };
  } else {
    const cgst = (amount * cgstRate) / 100;
    const sgst = (amount * sgstRate) / 100;
    return { cgst, sgst, igst: 0, total: cgst + sgst };
  }
}

// Format date to DD/MM/YYYY (Indian format)
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Format date for input fields (YYYY-MM-DD)
export function toInputDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

// Get financial year string
export function getFYString(date: Date = new Date(), fyStartMonth: number = 4): string {
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();
  if (month >= fyStartMonth) {
    return `FY ${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(2)}`;
  }
}

// Get GST return periods
export function getGSTReturnPeriods(): Array<{ label: string; value: string; dueDate: string }> {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const now = new Date();
  const result = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth(); // 0-indexed
    const year = d.getFullYear();
    const dueDate = new Date(year, month + 1, 11); // GSTR-1 due by 11th of next month
    result.push({
      label: `${months[month]} ${year}`,
      value: `${year}-${String(month + 1).padStart(2, "0")}`,
      dueDate: formatDate(dueDate),
    });
  }
  return result;
}

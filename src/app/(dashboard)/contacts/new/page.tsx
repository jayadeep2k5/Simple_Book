"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function NewContactPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/contacts"); }, []);
  return null;
}

"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO = "/logo-light.png";

export function SiteLogo() {
  return (
    <Link href="/" className="inline-flex items-center">
      <Image src={LOGO} alt="Seoul Now" width={120} height={32} priority />
    </Link>
  );
}

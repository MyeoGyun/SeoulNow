"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO = "/logo-light.png";

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="site-logo inline-flex items-center"
      aria-label="Seoul Now 홈으로 이동"
      prefetch={false}
    >
      <Image
        src={LOGO}
        alt="Seoul Now"
        width={120}
        height={32}
        priority
      />
    </Link>
  );
}

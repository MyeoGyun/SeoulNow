"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const LOGO = "/logo-light.png";

export function SiteLogo() {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      // 이미 메인 페이지에 있다면 데이터와 UI를 새로고침해 최신 상태를 반영한다
      window.location.reload();
      return;
    }

    // 다른 경로에 있는 경우 메인으로 이동하고 최신 데이터로 동기화한다
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="site-logo inline-flex items-center"
      aria-label="Seoul Now 홈으로 이동"
    >
      <Image src={LOGO} alt="Seoul Now" width={120} height={32} priority />
    </button>
  );
}

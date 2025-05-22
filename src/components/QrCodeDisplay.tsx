"use client";

import QRCodeStylized from 'qrcode.react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
}

export function QrCodeDisplay({ value, size = 256 }: QrCodeDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Skeleton className="w-[256px] h-[256px] rounded-lg" style={{ width: size, height: size}}/>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-inner inline-block border border-border">
      <QRCodeStylized
        value={value}
        size={size}
        level="H" // High error correction level
        bgColor="#ffffff"
        fgColor="#3F51B5" // Deep Indigo primary color
        imageSettings={{
          // Optional: embed a small logo in the center
          // src: "/logo-icon.png", // Path to your logo icon
          // height: 40,
          // width: 40,
          // excavate: true, // Remove QR dots behind logo
        }}
      />
    </div>
  );
}

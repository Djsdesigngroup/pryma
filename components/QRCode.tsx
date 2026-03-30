"use client";

import { QRCodeSVG } from "qrcode.react";

interface ProfileQRProps {
  url: string;
  size?: number;
}

export function ProfileQR({ url, size = 128 }: ProfileQRProps) {
  return (
    <QRCodeSVG
      value={url}
      size={size}
      bgColor="transparent"
      fgColor="#f5f5f5"
      level="M"
    />
  );
}

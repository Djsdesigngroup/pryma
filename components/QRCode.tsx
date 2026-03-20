"use client";

import { QRCodeSVG } from "qrcode.react";

interface ProfileQRProps {
  url: string;
}

export function ProfileQR({ url }: ProfileQRProps) {
  return (
    <QRCodeSVG
      value={url}
      size={128}
      bgColor="transparent"
      fgColor="#f5f5f5"
      level="M"
    />
  );
}

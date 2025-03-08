"use client";
import React, { Suspense } from "react";
import VerificateurBulletin from "./[bulletinId]/page";


export default function VerificationBulletinPage() {
  return (
    <Suspense fallback={<div>Chargement…</div>}>
      <VerificateurBulletin />
    </Suspense>
  );
}

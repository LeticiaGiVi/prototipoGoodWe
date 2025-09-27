import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";


export default function Detalhesispositivos() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4" data-testid="text-dispositivos-title">
        Detalhesispositivos
      </h1>
      <div className="text-muted-foreground" data-testid="text-dispositivos-content">
        Detalhesispositivos
      </div>
    </div>
  )
}
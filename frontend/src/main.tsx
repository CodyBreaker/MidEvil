import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Host from "@/components/host/preparation/Preparation";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Host />
  </StrictMode>,
)

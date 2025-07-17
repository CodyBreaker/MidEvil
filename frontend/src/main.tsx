import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Host from "@/components/host/Preperation";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Host />
  </StrictMode>,
)

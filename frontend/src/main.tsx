import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BoardRenderer} from "@/components/host/board/BoardRenderer.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BoardRenderer/>
    </StrictMode>,
)

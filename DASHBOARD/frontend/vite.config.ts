import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import flowbiteReact from "flowbite-react/plugin/vite";
import daisyui from 'daisyui'
 
export default defineConfig({
  plugins: [daisyui, tailwindcss(), react(), flowbiteReact()],
})
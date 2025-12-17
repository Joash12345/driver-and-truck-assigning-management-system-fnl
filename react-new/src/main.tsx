import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { TruckProvider } from '@/context/TruckContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ThemeProvider } from 'next-themes'

createRoot(document.getElementById("root")!).render(
	<AuthProvider>
		<NotificationProvider>
			<TruckProvider>
				<SidebarProvider>
					<ThemeProvider attribute="class" defaultTheme="system">
						<App />
					</ThemeProvider>
				</SidebarProvider>
			</TruckProvider>
		</NotificationProvider>
	</AuthProvider>
);

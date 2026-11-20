import { lazy, Suspense, useEffect, type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { AuthProvider, useAuth } from "@/auth/AuthProvider"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageSkeleton } from "@/components/ui/feedback"
import { OwnerDataProvider } from "@/data/OwnerData"

const named = <K extends string>(load: () => Promise<Record<K, () => ReactNode>>, name: K) => lazy(async () => ({ default: (await load())[name] }))

const HomePage = named(() => import("@/pages/home/HomePage"), "HomePage")
const SignInPage = named(() => import("@/pages/auth/SignInPage"), "SignInPage")
const ScanPage = named(() => import("@/pages/scan/ScanPage"), "ScanPage")
const TagPage = named(() => import("@/pages/scan/TagPage"), "TagPage")
const VisitorChatPage = named(() => import("@/pages/scan/VisitorChatPage"), "VisitorChatPage")
const NotFoundPage = named(() => import("@/pages/NotFoundPage"), "NotFoundPage")
const VehiclesPage = named(() => import("@/pages/app/VehiclesPage"), "VehiclesPage")
const AddVehiclePage = named(() => import("@/pages/app/AddVehiclePage"), "AddVehiclePage")
const VehiclePage = named(() => import("@/pages/app/VehiclePage"), "VehiclePage")
const EditVehiclePage = named(() => import("@/pages/app/EditVehiclePage"), "EditVehiclePage")
const InboxPage = named(() => import("@/pages/app/InboxPage"), "InboxPage")
const OwnerChatPage = named(() => import("@/pages/app/OwnerChatPage"), "OwnerChatPage")
const LinkStickerPage = named(() => import("@/pages/app/LinkStickerPage"), "LinkStickerPage")
const GetStickerPage = named(() => import("@/pages/app/GetStickerPage"), "GetStickerPage")
const SettingsPage = named(() => import("@/pages/app/SettingsPage"), "SettingsPage")

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function OwnerArea() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageSkeleton />
  if (!user) return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return (
    <OwnerDataProvider key={user.uid}>
      <AppLayout />
    </OwnerDataProvider>
  )
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<SignInPage />} />
            <Route path="/v/:cmtId" element={<ScanPage />} />
            <Route path="/t/:code" element={<TagPage />} />
            <Route path="/c/:roomKey" element={<VisitorChatPage />} />
            <Route path="/app" element={<OwnerArea />}>
              <Route index element={<VehiclesPage />} />
              <Route path="vehicles/new" element={<AddVehiclePage />} />
              <Route path="vehicles/:cmtId" element={<VehiclePage />} />
              <Route path="vehicles/:cmtId/edit" element={<EditVehiclePage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="chats/:chatId" element={<OwnerChatPage />} />
              <Route path="link-sticker" element={<LinkStickerPage />} />
              <Route path="get-sticker" element={<GetStickerPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

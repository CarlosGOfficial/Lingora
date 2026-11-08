import { AnnouncementBanner } from './components/AnnouncementBanner'
import { Fragment, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Shell } from './components/Shell'
import { ConversationPage } from './screens/ConversationPage'
import { FriendChatPage, GroupChatPage, NewGroupPage } from './screens/FriendChatPage'
import { FriendsPage } from './screens/FriendsPage'
import { GuidebookPage } from './screens/GuidebookPage'
import { Home } from './screens/Home'
import { LessonPage } from './screens/LessonPage'
import { Onboarding } from './screens/Onboarding'
import { PracticePage } from './screens/PracticePage'
import { PracticeSession } from './screens/PracticeSession'
import { ProfilePage } from './screens/ProfilePage'
import { PublicSite } from './screens/public/PublicSite'
import { ReadingPage } from './screens/ReadingPage'
import { StoriesPage, StoryPage } from './screens/StoriesPage'
import { GoalsPage } from './screens/GoalsPage'
import { ReviewPage } from './screens/ReviewPage'
import { SectionTestPage } from './screens/SectionTestPage'
import { SectionsPage } from './screens/SectionsPage'
import { ShopPage } from './screens/ShopPage'
import { ThemeStudioPage } from './screens/ThemeStudioPage'
import { UnitReviewPage } from './screens/UnitReviewPage'
import { UserProfilePage } from './screens/UserProfilePage'
import { ThemeApplier } from './theme/ThemeApplier'
import { useStore } from './store/useStore'
import { NotificationsWatcher } from './social/NotificationsWatcher'
import { usePresence } from './social/useFriends'
import { Toaster } from './components/Toaster'
import { refreshPush } from './lib/push'
import { startAutoSync } from './sync/sync'

/** Session screens hold state; give each lesson/story/mode a fresh instance. */
function Remount({ param, children }: { param: string; children: ReactNode }) {
  return <Fragment key={useParams()[param]}>{children}</Fragment>
}

export function App() {
  const onboarded = useStore((s) => s.onboarded)
  const signedIn = useStore((s) => !!s.account)
  const guest = useStore((s) => s.guest)
  const activeLang = useStore((s) => s.activeLang)
  const reconcileStreak = useStore((s) => s.reconcileStreak)

  useEffect(() => {
    reconcileStreak()
    const onFocus = () => reconcileStreak()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reconcileStreak])

  useEffect(() => {
    document.documentElement.dataset.lang = activeLang
  }, [activeLang])

  useEffect(() => startAutoSync(), [])
  const accountId = useStore((s) => s.account?.id)
  useEffect(() => {
    if (accountId) void refreshPush()
  }, [accountId])
  usePresence()

  // Visitors see the website and sign up or log in first; new accounts then pick a course.
  // (Device-only "guest" use is offered only when the server can't hold accounts.)
  // One router for all three, so logging in from a deep link can continue to it.
  return (
    <BrowserRouter>
      <ThemeApplier />
      <AnnouncementBanner />
      {!signedIn && !guest ? <PublicSite /> : !onboarded ? <Onboarding /> : <MainApp />}
    </BrowserRouter>
  )
}

function MainApp() {
  return (
    <>
      <NotificationsWatcher />
      <Toaster />
      <Routes>
        <Route path="/lesson/:lessonId" element={<Remount param="lessonId"><LessonPage /></Remount>} />
        <Route path="/reading/:readingId" element={<Remount param="readingId"><ReadingPage /></Remount>} />
        <Route path="/story/:storyId" element={<Remount param="storyId"><StoryPage /></Remount>} />
        <Route path="/unit-review/:unitId" element={<Remount param="unitId"><UnitReviewPage /></Remount>} />
        <Route path="/conversation" element={<ConversationPage />} />
        <Route path="/section-test/:index" element={<Remount param="index"><SectionTestPage /></Remount>} />
        <Route path="/practice/:mode" element={<Remount param="mode"><PracticeSession /></Remount>} />
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/chat/:userId" element={<FriendChatPage />} />
          <Route path="/friends/group/:groupId" element={<GroupChatPage />} />
          <Route path="/friends/groups/new" element={<NewGroupPage />} />
          <Route path="/u/:key" element={<UserProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/guide/:unitId" element={<GuidebookPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/themes" element={<ThemeStudioPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

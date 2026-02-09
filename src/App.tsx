import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AchievementNotificationContainer } from '@/components/achievements/AchievementNotification'
import { PWAUpdatePrompt } from '@/components/PWAUpdatePrompt'
import { InstallPWA } from '@/components/InstallPWA'
import { ThemeProvider } from '@/contexts/theme-provider'
import { AuthProvider } from '@/contexts/auth-provider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { PageLoader } from '@/components/PageLoader'
import ErrorBoundary from '@/components/ErrorBoundary'

const Layout = lazy(() => import('@/components/Layout'))
const Index = lazy(() => import('@/pages/Index'))
const LoginPage = lazy(() => import('@/pages/Login'))
const RegisterPage = lazy(() => import('@/pages/Register'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const FaqPage = lazy(() => import('@/pages/Faq'))
const ContactPage = lazy(() => import('@/pages/Contact'))
const TermsPage = lazy(() => import('@/pages/Terms'))
const PrivacyPage = lazy(() => import('@/pages/Privacy'))

const DashboardPage = lazy(() => import('@/pages/Dashboard'))

const CoursesPage = lazy(() => import('@/pages/Courses'))
const CourseDetailsPage = lazy(() => import('@/pages/CourseDetailsPage'))
const CourseLessonPage = lazy(() => import('@/pages/CourseLessonPage'))
const CalendarPage = lazy(() => import('@/pages/Calendar'))
const ProgressPage = lazy(() => import('@/pages/Progress'))
const EssaysPage = lazy(() => import('@/pages/Essays'))
const EssaySubmissionPage = lazy(() => import('@/pages/EssaySubmission'))
const EssayDetailsPage = lazy(() => import('@/pages/EssayDetails'))
const EssayReportPage = lazy(() => import('@/pages/EssayReportPage'))
const EssayEvolutionReportPage = lazy(
  () => import('@/pages/EssayEvolutionReportPage'),
)
const SimulationsPage = lazy(() => import('@/pages/Simulations'))
const SimulationExamPage = lazy(() => import('@/pages/SimulationExam'))
const SimulationResultsPage = lazy(() => import('@/pages/SimulationResults'))
const AnswerSheetsListPage = lazy(() => import('@/pages/AnswerSheetsListPage'))
const AnswerSheetFillPage = lazy(() => import('@/pages/AnswerSheetFillPage'))
const AnswerSheetResultPage = lazy(() => import('@/pages/AnswerSheetResultPage'))
const ForumPage = lazy(() => import('@/pages/Forum'))
const ForumTopicPage = lazy(() => import('@/pages/ForumTopic'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const FlashcardsPage = lazy(() => import('@/pages/Flashcards'))
const FlashcardTopicsPage = lazy(() => import('@/pages/FlashcardTopics'))
const FlashcardStudyPage = lazy(() => import('@/pages/FlashcardStudyPage'))
const FlashcardSessionResultPage = lazy(
  () => import('@/pages/FlashcardSessionResult'),
)
const QuizzesPage = lazy(() => import('@/pages/Quizzes'))
const QuizTopicsPage = lazy(() => import('@/pages/QuizTopics'))
const EvercastPage = lazy(() => import('@/pages/Evercast'))
const QuestionBankPage = lazy(() => import('@/pages/QuestionBank'))
const AcervoDigitalPage = lazy(() => import('@/pages/AcervoDigital'))
const MyFlashcardSetsPage = lazy(() => import('@/pages/MyFlashcardSets'))
const FlashcardSetEditorPage = lazy(() => import('@/pages/FlashcardSetEditor'))
const FlashcardSetCollaboratorsPage = lazy(
  () => import('@/pages/FlashcardSetCollaborators'),
)
const GroupStudyLobbyPage = lazy(() => import('@/pages/GroupStudyLobby'))
const GroupStudySessionPage = lazy(() => import('@/pages/GroupStudySession'))
const NotificationsPage = lazy(() => import('@/pages/Notifications'))
const QuizPlayerPage = lazy(() => import('@/pages/QuizPlayerPage'))
const QuizResultSummaryPage = lazy(
  () => import('@/pages/QuizResultSummaryPage'),
)
const FlashcardSessionHistoryPage = lazy(
  () => import('@/pages/FlashcardSessionHistory'),
)
const RankingPage = lazy(() => import('@/pages/Ranking'))
const AchievementsPage = lazy(() => import('@/pages/Achievements'))
const StudyPlannerPage = lazy(() => import('@/pages/StudyPlannerPage'))

const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminManagementPage = lazy(
  () => import('@/pages/admin/management/AdminManagementPage'),
)
const AdminUserFormPage = lazy(
  () => import('@/pages/admin/users/AdminUserFormPage'),
)
const AdminCoursesPage = lazy(
  () => import('@/pages/admin/courses/AdminCoursesPage'),
)
const AdminCourseFormPage = lazy(
  () => import('@/pages/admin/courses/AdminCourseFormPage'),
)
const AdminCourseContentPage = lazy(
  () => import('@/pages/admin/courses/AdminCourseContentPage'),
)
const AdminCourseClassesPage = lazy(
  () => import('@/pages/admin/courses/AdminCourseClassesPage'),
)
const AdminFlashcardsPage = lazy(
  () => import('@/pages/admin/flashcards/AdminFlashcardsPage'),
)
const AdminFlashcardTopicsPage = lazy(
  () => import('@/pages/admin/flashcards/AdminFlashcardTopicsPage'),
)
const AdminFlashcardsManagementPage = lazy(
  () => import('@/pages/admin/flashcards/AdminFlashcardsManagementPage'),
)
const AdminSubjectFormPage = lazy(
  () => import('@/pages/admin/flashcards/AdminSubjectFormPage'),
)
const AdminTopicFormPage = lazy(
  () => import('@/pages/admin/flashcards/AdminTopicFormPage'),
)
const AdminQuizzesPage = lazy(
  () => import('@/pages/admin/quizzes/AdminQuizzesPage'),
)
const AdminQuizFormPage = lazy(
  () => import('@/pages/admin/quizzes/AdminQuizFormPage'),
)
const AdminQuizQuestionsPage = lazy(
  () => import('@/pages/admin/quizzes/AdminQuizQuestionsPage'),
)
const AdminQuizReportsPage = lazy(
  () => import('@/pages/admin/quizzes/AdminQuizReportsPage'),
)
const AdminSimulationsPage = lazy(
  () => import('@/pages/admin/simulations/AdminSimulationsPage'),
)
const AdminSimulationFormPage = lazy(
  () => import('@/pages/admin/simulations/AdminSimulationFormPage'),
)
const AdminSimulationReportsPage = lazy(
  () => import('@/pages/admin/simulations/AdminSimulationReportsPage'),
)
const AdminQuestionsPage = lazy(
  () => import('@/pages/admin/questions/AdminQuestionsPage'),
)
const AdminQuestionFormPage = lazy(
  () => import('@/pages/admin/questions/AdminQuestionFormPage'),
)
const AdminCalendarPage = lazy(
  () => import('@/pages/admin/calendar/AdminCalendarPage'),
)
const AdminEvercastPage = lazy(
  () => import('@/pages/admin/evercast/AdminEvercastPage'),
)
const AdminEvercastFormPage = lazy(
  () => import('@/pages/admin/evercast/AdminEvercastFormPage'),
)
const AdminEssaysPage = lazy(
  () => import('@/pages/admin/essays/AdminEssaysPage'),
)
const AdminEssayFormPage = lazy(
  () => import('@/pages/admin/essays/AdminEssayFormPage'),
)
const AdminEssaySubmissionsPage = lazy(
  () => import('@/pages/admin/essays/AdminEssaySubmissionsPage'),
)
const AdminEssayCorrectionPage = lazy(
  () => import('@/pages/admin/essays/AdminEssayCorrectionPage'),
)
const AdminEssaySettingsPage = lazy(
  () => import('@/pages/admin/essays/AdminEssaySettingsPage'),
)
const AdminEssayComparisonPage = lazy(
  () => import('@/pages/admin/essays/AdminEssayComparisonPage'),
)
const AdminReportsPage = lazy(
  () => import('@/pages/admin/reports/AdminReportsPage'),
)
const AdminSettingsPage = lazy(
  () => import('@/pages/admin/settings/AdminSettingsPage'),
)
const AdminSystemControlPage = lazy(
  () => import('@/pages/admin/system/AdminSystemControlPage'),
)
const AdminClassPermissionsPage = lazy(
  () => import('@/pages/admin/permissions/AdminClassPermissionsPage'),
)
const AdminClassesPage = lazy(
  () => import('@/pages/admin/classes/AdminClassesPage'),
)
const AdminGamificationPage = lazy(
  () => import('@/pages/admin/gamification/AdminGamificationPage'),
)
const AdminClassStudentsPage = lazy(
  () => import('@/pages/admin/classes/AdminClassStudentsPage'),
)
const AdminClassFormPage = lazy(
  () => import('@/pages/admin/classes/AdminClassFormPage'),
)
const AdminStudentClassesPage = lazy(
  () => import('@/pages/admin/users/AdminStudentClassesPage'),
)
const MemberkitImportPage = lazy(
  () => import('@/pages/admin/integrations/MemberkitImportPage'),
)
const AdminIntegrationsPage = lazy(
  () => import('@/pages/admin/integrations/AdminIntegrationsPage'),
)
const AudioLessonPlayerPage = lazy(
  () => import('@/pages/AudioLessonPlayerPage'),
)

const App = () => (
  <ErrorBoundary>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <InstallPWA />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']} />
                }
              >
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/meus-cursos" element={<CoursesPage />} />
                  <Route
                    path="/meus-cursos/:courseId"
                    element={<CourseDetailsPage />}
                  />
                  <Route
                    path="/meus-cursos/:courseId/lesson/:lessonId"
                    element={<CourseLessonPage />}
                  />
                  <Route path="/calendario" element={<CalendarPage />} />
                  <Route path="/flashcards" element={<FlashcardsPage />} />
                  <Route
                    path="/flashcards/:subjectId"
                    element={<FlashcardTopicsPage />}
                  />
                  <Route
                    path="/flashcards/:subjectId/:topicId/study"
                    element={<FlashcardStudyPage />}
                  />
                  <Route
                    path="/flashcards/session/:sessionId/result"
                    element={<FlashcardSessionResultPage />}
                  />
                  <Route
                    path="/meus-conjuntos"
                    element={<MyFlashcardSetsPage />}
                  />
                  <Route
                    path="/conjuntos/novo"
                    element={<FlashcardSetEditorPage />}
                  />
                  <Route
                    path="/conjuntos/:setId/editar"
                    element={<FlashcardSetEditorPage />}
                  />
                  <Route
                    path="/conjuntos/:setId/colaboradores"
                    element={<FlashcardSetCollaboratorsPage />}
                  />
                  <Route
                    path="/conjuntos/:setId/estudo-em-grupo"
                    element={<GroupStudyLobbyPage />}
                  />
                  <Route
                    path="/estudo-em-grupo/:sessionId"
                    element={<GroupStudySessionPage />}
                  />
                  <Route path="/quizzes" element={<QuizzesPage />} />
                  <Route
                    path="/quizzes/:subjectId"
                    element={<QuizTopicsPage />}
                  />
                  <Route path="/quiz/:quizId" element={<QuizPlayerPage />} />
                  <Route
                    path="/quiz/:quizId/results"
                    element={<QuizResultSummaryPage />}
                  />
                  <Route path="/evercast" element={<EvercastPage />} />
                  <Route
                    path="/evercast/:audioId"
                    element={<AudioLessonPlayerPage />}
                  />
                  <Route path="/progresso" element={<ProgressPage />} />
                  <Route
                    path="/progresso/historico-flashcards"
                    element={<FlashcardSessionHistoryPage />}
                  />
                  <Route path="/redacoes" element={<EssaysPage />} />
                  <Route
                    path="/redacoes/nova"
                    element={<EssaySubmissionPage />}
                  />
                  <Route
                    path="/redacoes/:essayId"
                    element={<EssayDetailsPage />}
                  />
                  <Route
                    path="/redacoes/:essayId/report"
                    element={<EssayReportPage />}
                  />
                  <Route
                    path="/redacoes/evolucao"
                    element={<EssayEvolutionReportPage />}
                  />
                  <Route path="/simulados" element={<SimulationsPage />} />
                  <Route
                    path="/simulados/:simulationId"
                    element={<SimulationExamPage />}
                  />
                  <Route
                    path="/simulados/:simulationId/resultado"
                    element={<SimulationResultsPage />}
                  />
                  <Route path="/cartoes-resposta" element={<AnswerSheetsListPage />} />
                  <Route
                    path="/cartao-resposta/:sheetId"
                    element={<AnswerSheetFillPage />}
                  />
                  <Route
                    path="/cartao-resposta/:sheetId/resultado"
                    element={<AnswerSheetResultPage />}
                  />
                  <Route
                    path="/banco-de-questoes"
                    element={<QuestionBankPage />}
                  />
                  <Route path="/acervo" element={<AcervoDigitalPage />} />
                  <Route path="/forum" element={<ForumPage />} />
                  <Route path="/forum/:topicId" element={<ForumTopicPage />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                  <Route path="/notificacoes" element={<NotificationsPage />} />
                  <Route path="/ranking" element={<RankingPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/study-planner" element={<StudyPlannerPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/contato" element={<ContactPage />} />
                  <Route path="/termos" element={<TermsPage />} />
                  <Route path="/privacidade" element={<PrivacyPage />} />
                </Route>
              </Route>

              {/* ROTAS APENAS PARA ADMINISTRATOR */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['administrator']} />
                }
              >
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="system-control" element={<AdminSystemControlPage />} />
                  <Route path="permissions" element={<AdminClassPermissionsPage />} />
                  <Route path="management" element={<AdminManagementPage />} />
                  <Route path="classes" element={<AdminClassesPage />} />
                  <Route path="classes/new" element={<AdminClassFormPage />} />
                  <Route path="classes/:classId/edit" element={<AdminClassFormPage />} />
                  <Route path="classes/:classId/students" element={<AdminClassStudentsPage />} />
                  <Route path="integrations" element={<AdminIntegrationsPage />} />
                  <Route path="integrations/memberkit-import" element={<MemberkitImportPage />} />
                  <Route path="gamification" element={<AdminGamificationPage />} />
                  <Route
                    path="users/:userId/edit"
                    element={<AdminUserFormPage />}
                  />
                  <Route
                    path="users/:userId/classes"
                    element={<AdminStudentClassesPage />}
                  />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              {/* ROTAS PARA ADMINISTRATOR E TEACHER (Gestão de Conteúdo) */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['administrator', 'teacher']} />
                }
              >
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="courses" element={<AdminCoursesPage />} />
                  <Route path="courses/new" element={<AdminCourseFormPage />} />
                  <Route
                    path="courses/:courseId/edit"
                    element={<AdminCourseFormPage />}
                  />
                  <Route
                    path="courses/:courseId/content"
                    element={<AdminCourseContentPage />}
                  />
                  <Route
                    path="courses/:courseId/classes"
                    element={<AdminCourseClassesPage />}
                  />
                  <Route path="flashcards" element={<AdminFlashcardsPage />} />
                  <Route path="flashcards/new" element={<AdminSubjectFormPage />} />
                  <Route
                    path="flashcards/:subjectId"
                    element={<AdminFlashcardTopicsPage />}
                  />
                  <Route
                    path="flashcards/:subjectId/edit"
                    element={<AdminSubjectFormPage />}
                  />
                  <Route
                    path="flashcards/:subjectId/topics/new"
                    element={<AdminTopicFormPage />}
                  />
                  <Route
                    path="flashcards/:subjectId/topics/:topicId/edit"
                    element={<AdminTopicFormPage />}
                  />
                  <Route
                    path="flashcards/:subjectId/:topicId"
                    element={<AdminFlashcardsManagementPage />}
                  />
                  <Route path="quizzes" element={<AdminQuizzesPage />} />
                  <Route path="quizzes/new" element={<AdminQuizFormPage />} />
                  <Route
                    path="quizzes/:quizId/edit"
                    element={<AdminQuizFormPage />}
                  />
                  <Route
                    path="quizzes/:quizId/questions"
                    element={<AdminQuizQuestionsPage />}
                  />
                  <Route
                    path="quizzes/:quizId/reports"
                    element={<AdminQuizReportsPage />}
                  />
                  <Route
                    path="simulations"
                    element={<AdminSimulationsPage />}
                  />
                  <Route
                    path="simulations/new"
                    element={<AdminSimulationFormPage />}
                  />
                  <Route
                    path="simulations/:simulationId/edit"
                    element={<AdminSimulationFormPage />}
                  />
                  <Route
                    path="simulations/:simulationId/reports"
                    element={<AdminSimulationReportsPage />}
                  />
                  <Route path="questions" element={<AdminQuestionsPage />} />
                  <Route
                    path="questions/new"
                    element={<AdminQuestionFormPage />}
                  />
                  <Route
                    path="questions/:questionId/edit"
                    element={<AdminQuestionFormPage />}
                  />
                  <Route path="calendar" element={<AdminCalendarPage />} />
                  <Route path="evercast" element={<AdminEvercastPage />} />
                  <Route
                    path="evercast/new"
                    element={<AdminEvercastFormPage />}
                  />
                  <Route
                    path="evercast/:evercastId/edit"
                    element={<AdminEvercastFormPage />}
                  />
                  <Route path="essays" element={<AdminEssaysPage />} />
                  <Route path="essays/new" element={<AdminEssayFormPage />} />
                  <Route
                    path="essays/:promptId/edit"
                    element={<AdminEssayFormPage />}
                  />
                  <Route
                    path="essays/:promptId/submissions"
                    element={<AdminEssaySubmissionsPage />}
                  />
                  <Route
                    path="essays/submissions/:submissionId"
                    element={<AdminEssayCorrectionPage />}
                  />
                  <Route
                    path="essays/compare"
                    element={<AdminEssayComparisonPage />}
                  />
                  <Route
                    path="essays/settings"
                    element={<AdminEssaySettingsPage />}
                  />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
        <AchievementNotificationContainer />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
)

export default App

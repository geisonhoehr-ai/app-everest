import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  FileText,
  PenLine,
  BookOpen,
  Lightbulb,
  Save,
  Send,
  Trash2,
  Plus,
  ImageIcon,
} from 'lucide-react'
import {
  getEssayForCorrection,
  type EssayForCorrection,
} from '@/services/essayService'
import { useAuth } from '@/hooks/use-auth'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { createNotification } from '@/services/notificationService'
import { aiCorrectionService } from '@/services/ai/aiCorrectionService'
import { ciaarCorrectionService } from '@/services/ciaarCorrectionService'
import type {
  CorrectionTemplate,
  CorrectionResult,
  ExpressionError,
  StructureAnalysis,
  ContentAnalysis,
  ImprovementSuggestion,
} from '@/types/essay-correction'
import { calculateFinalGrade } from '@/types/essay-correction'

export default function AdminEssayCorrectionPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [essay, setEssay] = useState<EssayForCorrection | null>(null)
  const [template, setTemplate] = useState<CorrectionTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAILoading, setIsAILoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  // CIAAR correction data
  const [expressionErrors, setExpressionErrors] = useState<ExpressionError[]>([])
  const [structureAnalysis, setStructureAnalysis] = useState<StructureAnalysis[]>([])
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis[]>([])
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([])
  const [transcribedText, setTranscribedText] = useState('')
  const [teacherFeedback, setTeacherFeedback] = useState('')

  useEffect(() => {
    if (!submissionId) return
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [essayData, templateData, existingCorrection] = await Promise.all([
          getEssayForCorrection(submissionId),
          ciaarCorrectionService.getDefaultTemplate(),
          ciaarCorrectionService.loadCorrection(submissionId),
        ])

        setEssay(essayData)
        setTemplate(templateData)

        // Load existing CIAAR correction data if available
        if (existingCorrection) {
          setExpressionErrors(existingCorrection.expressionErrors)
          setStructureAnalysis(existingCorrection.structureAnalysis)
          setContentAnalysis(existingCorrection.contentAnalysis)
          setSuggestions(existingCorrection.improvementSuggestions)
        }

        // Load transcribed text
        if ((essayData as any)?.transcribed_text) {
          setTranscribedText((essayData as any).transcribed_text)
        }

        // Load file URL for image/PDF essays
        if ((essayData as any)?.file_url) {
          const { data } = await supabase.storage
            .from('essays')
            .createSignedUrl((essayData as any).file_url, 3600)
          if (data?.signedUrl) setFileUrl(data.signedUrl)
        }
      } catch {
        toast({ title: 'Erro ao carregar redação', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [submissionId])

  // Calculate totals and final grade
  const expressionDebitTotal = expressionErrors.reduce((sum, e) => sum + e.debit_value, 0)
  const structureDebitTotal = structureAnalysis.reduce((sum, s) => sum + s.debit_value, 0)
  const contentDebitTotal = contentAnalysis.reduce((sum, c) => sum + c.debit_value, 0)
  const finalGrade = calculateFinalGrade(
    template?.max_grade ?? 10,
    expressionDebitTotal,
    structureDebitTotal,
    contentDebitTotal,
    contentAnalysis
  )

  const handleAICorrection = async () => {
    if (!essay || !template) {
      toast({ title: 'Template de correção não encontrado', variant: 'destructive' })
      return
    }

    const textToCorrect = transcribedText || essay.submission_text
    if (!textToCorrect) {
      toast({ title: 'Nenhum texto para corrigir', description: 'Transcreva o texto ou verifique a redação.', variant: 'destructive' })
      return
    }

    try {
      setIsAILoading(true)
      toast({ title: 'Iniciando correção com IA...', description: 'Isso pode levar de 15 a 30 segundos.' })

      const result: CorrectionResult = await aiCorrectionService.correctEssay({
        essayText: textToCorrect,
        theme: essay.essay_prompts?.title || 'Tema Livre',
        correctionTemplate: {
          name: template.name,
          max_grade: template.max_grade,
          expression_debit_value: template.expression_debit_value,
          structure_criteria: template.structure_criteria,
          content_criteria: template.content_criteria,
        },
        studentName: `${essay.users?.first_name || ''} ${essay.users?.last_name || ''}`.trim() || undefined,
      })

      // Populate correction data from AI response
      setExpressionErrors(result.expressionErrors || [])
      setStructureAnalysis(result.structureAnalysis || [])
      setContentAnalysis(result.contentAnalysis || [])
      setSuggestions(result.improvementSuggestions || [])

      toast({ title: 'Correção IA concluída!', description: 'Revise os resultados antes de finalizar.' })
    } catch (err: any) {
      toast({
        title: 'Erro na correção IA',
        description: err.message || 'Não foi possível gerar a correção.',
        variant: 'destructive',
      })
    } finally {
      setIsAILoading(false)
    }
  }

  const handleTranscribe = async () => {
    if (!fileUrl) return
    try {
      setIsTranscribing(true)
      toast({ title: 'Transcrevendo redação manuscrita...' })
      const text = await aiCorrectionService.transcribeEssay([fileUrl])
      setTranscribedText(text)

      // Save transcription to DB
      if (submissionId) {
        await supabase
          .from('essays')
          .update({ transcribed_text: text })
          .eq('id', submissionId)
      }

      toast({ title: 'Transcrição concluída!' })
    } catch (err: any) {
      toast({
        title: 'Erro na transcrição',
        description: err.message || 'Não foi possível transcrever.',
        variant: 'destructive',
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleSaveCorrection = async () => {
    if (!submissionId || !user || !template?.id) return

    setIsSaving(true)
    try {
      const result: CorrectionResult = {
        expressionErrors,
        structureAnalysis,
        contentAnalysis,
        improvementSuggestions: suggestions,
        totalExpressionDebit: expressionDebitTotal,
        totalStructureDebit: structureDebitTotal,
        totalContentDebit: contentDebitTotal,
        finalGrade,
      }

      await ciaarCorrectionService.saveCorrection(
        submissionId,
        result,
        template.id,
        user.id
      )

      toast({ title: 'Correção salva com sucesso!' })
    } catch {
      toast({ title: 'Erro ao salvar correção', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalizeCorrection = async () => {
    if (!submissionId || !user || !essay || !template?.id) return

    setIsSaving(true)
    try {
      const result: CorrectionResult = {
        expressionErrors,
        structureAnalysis,
        contentAnalysis,
        improvementSuggestions: suggestions,
        totalExpressionDebit: expressionDebitTotal,
        totalStructureDebit: structureDebitTotal,
        totalContentDebit: contentDebitTotal,
        finalGrade,
      }

      await ciaarCorrectionService.saveCorrection(
        submissionId,
        result,
        template.id,
        user.id
      )

      // Update essay status and notify student
      await supabase
        .from('essays')
        .update({
          status: 'corrected',
          teacher_feedback_text: teacherFeedback || null,
        })
        .eq('id', submissionId)

      await createNotification({
        user_id: essay.student_id,
        type: 'essay_corrected',
        title: 'Sua redação foi corrigida!',
        message: `A redação sobre "${essay.essay_prompts?.title}" recebeu nota ${finalGrade.toFixed(3)}.`,
        related_entity_id: essay.id,
        related_entity_type: 'essay',
      })

      toast({ title: 'Correção finalizada e aluno notificado!' })
      navigate(`/admin/essays/${essay.prompt_id}/submissions`)
    } catch {
      toast({ title: 'Erro ao finalizar correção', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // --- Expression Error management ---
  const removeExpressionError = (index: number) => {
    setExpressionErrors(prev => prev.filter((_, i) => i !== index))
  }

  const addExpressionError = () => {
    setExpressionErrors(prev => [...prev, {
      paragraph_number: 1,
      sentence_number: 1,
      error_text: '',
      error_explanation: '',
      suggested_correction: '',
      debit_value: template?.expression_debit_value ?? 0.2,
      source: 'manual',
    }])
  }

  const updateExpressionError = (index: number, field: keyof ExpressionError, value: string | number) => {
    setExpressionErrors(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  // --- Render ---
  if (isLoading) return <SectionLoader />

  if (!essay) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Redação não encontrada</h1>
        <Button variant="outline" onClick={() => navigate('/admin/essays')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  const studentName = `${essay.users?.first_name || ''} ${essay.users?.last_name || ''}`.trim()
  const className = essay.users?.student_classes?.[0]?.classes?.name
  const essayText = transcribedText || essay.submission_text || ''
  const isImage = fileUrl && /\.(jpg|jpeg|png)$/i.test((essay as any).file_url || '')

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <button
            onClick={() => navigate(`/admin/essays/${essay.prompt_id}/submissions`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos envios
          </button>
          <h1 className="text-xl font-bold text-foreground">Correção CIAAR</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{studentName || 'Aluno'}</span>
            {className && <Badge variant="outline" className="text-xs">{className}</Badge>}
            <Badge variant="outline" className="text-xs">{essay.essay_prompts?.title || 'Tema Livre'}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Grade display */}
          <div className="text-right mr-4">
            <div className="text-xs text-muted-foreground">Nota</div>
            <div className={`text-2xl font-bold ${finalGrade >= 7 ? 'text-green-600' : finalGrade >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
              {finalGrade.toFixed(3)}
            </div>
            <div className="text-[10px] text-muted-foreground">/ {template?.max_grade ?? 10}</div>
          </div>

          {fileUrl && !transcribedText && (
            <Button size="sm" onClick={handleTranscribe} disabled={isTranscribing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ImageIcon className="h-4 w-4 mr-1" />}
              Transcrever
            </Button>
          )}

          <Button size="sm" onClick={handleAICorrection} disabled={isAILoading || !essayText}
            className="bg-violet-600 hover:bg-violet-700 text-white">
            {isAILoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {isAILoading ? 'Analisando...' : 'Correção IA'}
          </Button>

          <Button size="sm" variant="outline" onClick={handleSaveCorrection} disabled={isSaving}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>

          <Button size="sm" onClick={handleFinalizeCorrection} disabled={isSaving || expressionErrors.length === 0 && contentAnalysis.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Send className="h-4 w-4 mr-1" /> Finalizar
          </Button>
        </div>
      </div>

      {/* Main content: Essay + Correction Panel */}
      <div className="grid lg:grid-cols-5 gap-4 flex-grow overflow-hidden">
        {/* Left: Essay text or image */}
        <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3 px-4 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Redação
                {transcribedText && <Badge variant="secondary" className="text-[10px]">Transcrita</Badge>}
                {essay.submission_text && fileUrl && (
                  <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Texto + Arquivo</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Student-typed text (submission_text) */}
                {essay.submission_text && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PenLine className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Texto digitado pelo aluno</span>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/30">
                      {essay.submission_text}
                    </div>
                  </div>
                )}

                {/* Transcribed text (from AI OCR) */}
                {transcribedText && transcribedText !== essay.submission_text && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Texto transcrito (IA)</span>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap bg-violet-50/50 dark:bg-violet-950/20 rounded-lg p-3 border border-violet-200/50 dark:border-violet-800/30">
                      {transcribedText}
                    </div>
                  </div>
                )}

                {/* File (PDF or image) */}
                {fileUrl && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Arquivo enviado</span>
                    </div>
                    {isImage ? (
                      <img src={fileUrl} alt="Redação" className="max-w-full h-auto rounded-lg border" />
                    ) : (
                      <iframe src={fileUrl} className="w-full h-[500px] rounded-lg border" title="Redação PDF" />
                    )}
                  </div>
                )}

                {/* Fallback: no content */}
                {!essay.submission_text && !transcribedText && !fileUrl && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm italic">Nenhum texto disponível</p>
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>

        {/* Right: CIAAR Correction Panel with tabs */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <Tabs defaultValue="expression" className="h-full flex flex-col">
            <TabsList className="w-full shrink-0 grid grid-cols-4 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="expression" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-950/40 dark:data-[state=active]:text-red-400">
                <PenLine className="h-3.5 w-3.5" />
                Expressão
                {expressionErrors.length > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 ml-1">{expressionErrors.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="structure" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950/40 dark:data-[state=active]:text-blue-400">
                <BookOpen className="h-3.5 w-3.5" />
                Estrutura
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-950/40 dark:data-[state=active]:text-amber-400">
                <FileText className="h-3.5 w-3.5" />
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-400">
                <Lightbulb className="h-3.5 w-3.5" />
                Sugestões
              </TabsTrigger>
            </TabsList>

            {/* Expression Errors Tab */}
            <TabsContent value="expression" className="flex-1 overflow-hidden mt-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3 px-4 shrink-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Erros de Expressão</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {expressionErrors.length} erros | Débito total: -{expressionDebitTotal.toFixed(3)}
                    </p>
                  </div>
                  <Button size="sm" onClick={addExpressionError}
                    className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="px-4 pb-4 space-y-3">
                    {expressionErrors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Nenhum erro de expressão encontrado</p>
                        <p className="text-xs">Use "Correção IA" ou adicione manualmente</p>
                      </div>
                    ) : (
                      expressionErrors.map((error, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">
                              P{error.paragraph_number}, Per. {error.sentence_number}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-[10px]">
                                -{error.debit_value.toFixed(3)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeExpressionError(index)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground">Trecho com erro</label>
                              <Textarea
                                value={error.error_text}
                                onChange={(e) => updateExpressionError(index, 'error_text', e.target.value)}
                                rows={1}
                                className="text-xs min-h-[32px] bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground">Explicação</label>
                              <Textarea
                                value={error.error_explanation}
                                onChange={(e) => updateExpressionError(index, 'error_explanation', e.target.value)}
                                rows={2}
                                className="text-xs min-h-[48px]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-muted-foreground">Correção sugerida</label>
                              <Textarea
                                value={error.suggested_correction}
                                onChange={(e) => updateExpressionError(index, 'suggested_correction', e.target.value)}
                                rows={1}
                                className="text-xs min-h-[32px] bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            </TabsContent>

            {/* Structure Analysis Tab */}
            <TabsContent value="structure" className="flex-1 overflow-hidden mt-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3 px-4 shrink-0">
                  <CardTitle className="text-sm">Análise de Estrutura</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {structureAnalysis.length} parágrafos | Débito total: -{structureDebitTotal.toFixed(3)}
                  </p>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="px-4 pb-4 space-y-3">
                    {structureAnalysis.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Análise de estrutura pendente</p>
                        <p className="text-xs">Use "Correção IA" para gerar a análise</p>
                      </div>
                    ) : (
                      structureAnalysis.map((analysis, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                Parágrafo {analysis.paragraph_number}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {analysis.paragraph_type === 'introduction' ? 'Introdução' :
                                  analysis.paragraph_type === 'conclusion' ? 'Conclusão' :
                                    'Desenvolvimento'}
                              </Badge>
                            </div>
                            <Badge
                              variant={analysis.debit_value > 0 ? 'destructive' : 'outline'}
                              className="text-[10px]"
                            >
                              {analysis.debit_value > 0 ? `-${analysis.debit_value.toFixed(3)}` : 'OK'}
                            </Badge>
                          </div>
                          <Textarea
                            value={analysis.analysis_text}
                            onChange={(e) => {
                              setStructureAnalysis(prev =>
                                prev.map((s, i) => i === index ? { ...s, analysis_text: e.target.value } : s)
                              )
                            }}
                            rows={3}
                            className="text-xs"
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            </TabsContent>

            {/* Content Analysis Tab */}
            <TabsContent value="content" className="flex-1 overflow-hidden mt-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3 px-4 shrink-0">
                  <CardTitle className="text-sm">Análise de Conteúdo</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {contentAnalysis.length} critérios | Débito total: -{contentDebitTotal.toFixed(3)}
                  </p>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="px-4 pb-4 space-y-3">
                    {contentAnalysis.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Análise de conteúdo pendente</p>
                        <p className="text-xs">Use "Correção IA" para gerar a análise</p>
                      </div>
                    ) : (
                      contentAnalysis.map((analysis, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{analysis.criterion_name}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={analysis.debit_level === 'Fuga TOTAL' ? 'destructive' : 'outline'}
                                className="text-[10px]"
                              >
                                {analysis.debit_level}
                              </Badge>
                              <Badge
                                variant={analysis.debit_value > 0 ? 'destructive' : 'outline'}
                                className="text-[10px]"
                              >
                                {analysis.debit_value > 0 ? `-${analysis.debit_value.toFixed(3)}` : 'Sem débito'}
                              </Badge>
                            </div>
                          </div>

                          {analysis.debit_level === 'Fuga TOTAL' && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md px-3 py-1.5">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs font-medium">Fuga total: nota final automaticamente 0</span>
                            </div>
                          )}

                          <Textarea
                            value={analysis.analysis_text}
                            onChange={(e) => {
                              setContentAnalysis(prev =>
                                prev.map((c, i) => i === index ? { ...c, analysis_text: e.target.value } : c)
                              )
                            }}
                            rows={3}
                            className="text-xs"
                          />
                        </div>
                      ))
                    )}

                    {/* Teacher feedback at the end of Content tab */}
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comentários Gerais do Professor</label>
                      <Textarea
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        rows={4}
                        placeholder="Observações gerais sobre a redação, dicas para o aluno..."
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </ScrollArea>
              </Card>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="flex-1 overflow-hidden mt-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-3 px-4 shrink-0">
                  <CardTitle className="text-sm">Sugestões de Melhoria</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suggestions.length} sugestões para o aluno
                  </p>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="px-4 pb-4 space-y-3">
                    {suggestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Nenhuma sugestão ainda</p>
                        <p className="text-xs">Use "Correção IA" para gerar sugestões</p>
                      </div>
                    ) : (
                      suggestions.map((suggestion, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[10px]">
                              {suggestion.category === 'expression' ? 'Expressão' :
                                suggestion.category === 'structure' ? 'Estrutura' : 'Conteúdo'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setSuggestions(prev => prev.filter((_, i) => i !== index))}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <Textarea
                            value={suggestion.suggestion_text}
                            onChange={(e) => {
                              setSuggestions(prev =>
                                prev.map((s, i) => i === index ? { ...s, suggestion_text: e.target.value } : s)
                              )
                            }}
                            rows={3}
                            className="text-xs"
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom: Grade summary */}
      <div className="shrink-0 border-t pt-3 bg-muted/30 -mx-4 px-4 -mb-4 pb-4 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-200/50 dark:border-red-800/30">
              <PenLine className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-red-700 dark:text-red-400 font-medium">-{expressionDebitTotal.toFixed(3)}</span>
              <span className="text-[10px] text-red-500/70">({expressionErrors.length})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">-{structureDebitTotal.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">-{contentDebitTotal.toFixed(3)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Nota Final</span>
            <div className={`text-2xl font-bold px-4 py-1 rounded-lg ${
              finalGrade >= 7 ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
              finalGrade >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
            }`}>
              {finalGrade.toFixed(3)}
            </div>
            <span className="text-xs text-muted-foreground">/ {template?.max_grade ?? 10}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

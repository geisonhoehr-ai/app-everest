import { MagicCard } from '@/components/ui/magic-card'
import { MagicLayout } from '@/components/ui/magic-layout'
import { Button } from '@/components/ui/button'
import { Folder, FileText, Video, ExternalLink, Library, Archive, BookOpen, Star } from 'lucide-react'

// Mock Data - In a real app, this could come from DB or be editable by Admin
const acervoItems = [
    {
        title: 'Português - Material Completo',
        description: 'PDFs de gramática, interpretação de texto e redação.',
        type: 'folder',
        link: 'https://drive.google.com/drive/u/0/my-drive', // Placeholder
        color: 'blue'
    },
    {
        title: 'Legislação e Regulamentos',
        description: 'Coletânea de leis, estatutos e regulamentos atualizados.',
        type: 'folder',
        link: '#',
        color: 'green'
    },
    {
        title: 'Provas Anteriores (2020-2024)',
        description: 'Arquivo com todas as provas aplicadas nos últimos anos.',
        type: 'folder',
        link: '#',
        color: 'orange'
    },
    {
        title: 'Livro: Gramática do Cegalla',
        description: 'Versão digitalizada para consulta rápida.',
        type: 'pdf',
        link: '#',
        color: 'red'
    },
    {
        title: 'Manual de Redação Oficial',
        description: 'Guia prático para redação de documentos oficiais.',
        type: 'pdf',
        link: '#',
        color: 'purple'
    }
]

const totalFolders = acervoItems.filter(i => i.type === 'folder').length
const totalPdfs = acervoItems.filter(i => i.type === 'pdf').length
const totalVideos = acervoItems.filter(i => i.type === 'video').length

export default function AcervoDigitalPage() {
    return (
        <MagicLayout
            title="Acervo Digital"
            description="Sua biblioteca virtual com materiais de estudo, livros e arquivos externos"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Stats */}
                <MagicCard variant="premium" size="lg">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                                    <Library className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                        Acervo Digital
                                    </h1>
                                    <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                                        Acesse materiais de estudo, livros em PDF e bancos de arquivos
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                                <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                <span className="text-xs md:text-sm font-medium">Biblioteca Virtual</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                                <Archive className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                                <div className="text-xl md:text-2xl font-bold text-blue-600">{acervoItems.length}</div>
                                <div className="text-xs md:text-sm text-muted-foreground">Total Materiais</div>
                            </div>
                            <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                                <Folder className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                                <div className="text-xl md:text-2xl font-bold text-green-600">{totalFolders}</div>
                                <div className="text-xs md:text-sm text-muted-foreground">Pastas</div>
                            </div>
                            <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                                <FileText className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                                <div className="text-xl md:text-2xl font-bold text-purple-600">{totalPdfs}</div>
                                <div className="text-xs md:text-sm text-muted-foreground">PDFs</div>
                            </div>
                            <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                                <div className="text-xl md:text-2xl font-bold text-orange-600">{totalVideos}</div>
                                <div className="text-xs md:text-sm text-muted-foreground">Vídeos</div>
                            </div>
                        </div>
                    </div>
                </MagicCard>

                {/* Grid de Conteúdo */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {acervoItems.map((item, index) => (
                        <MagicCard
                            key={index}
                            className="group flex flex-col justify-between overflow-hidden"
                            led={true}
                            ledColor={item.color === 'blue' ? 'blue' : item.color === 'red' ? 'pink' : item.color === 'green' ? 'green' : item.color === 'orange' ? 'orange' : 'purple'}
                        >
                            <div className="p-6 space-y-4">
                                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110
                    ${item.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                                        item.color === 'green' ? 'bg-green-500/10 text-green-500' :
                                            item.color === 'red' ? 'bg-red-500/10 text-red-500' :
                                                item.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-purple-500/10 text-purple-500'}
                  `}>
                                    {item.type === 'folder' ? <Folder className="h-6 w-6" /> :
                                        item.type === 'video' ? <Video className="h-6 w-6" /> :
                                            <FileText className="h-6 w-6" />}
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 pt-0">
                                <Button
                                    className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                    variant="outline"
                                    asChild
                                >
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                        <span>Acessar Material</span>
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </MagicCard>
                    ))}
                </div>
            </div>
        </MagicLayout>
    )
}

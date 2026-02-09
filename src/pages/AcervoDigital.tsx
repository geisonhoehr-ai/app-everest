import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Folder, FileText, Video, ExternalLink, Library } from 'lucide-react'

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

export default function AcervoDigitalPage() {
    return (
        <div className="flex flex-col gap-8 pb-20 fade-in slide-in-from-bottom-4 duration-500 animate-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                            Acervo Digital
                        </h1>
                        <p className="text-indigo-200 max-w-xl text-lg">
                            Sua biblioteca virtual. Acesse materiais de estudo, livros em PDF e bancos de arquivos externos.
                        </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                        <Library className="h-10 w-10 text-indigo-300" />
                    </div>
                </div>
            </div>

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
    )
}

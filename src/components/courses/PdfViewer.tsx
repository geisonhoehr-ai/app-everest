import { Card, CardContent } from '@/components/ui/card'

interface PdfViewerProps {
  fileUrl: string
}

export const PdfViewer = ({ fileUrl }: PdfViewerProps) => {
  return (
    <Card className="h-full w-full">
      <CardContent className="p-2 h-full">
        <iframe
          src={fileUrl}
          className="w-full h-full border-0 rounded-md"
          title="PDF Viewer"
        />
      </CardContent>
    </Card>
  )
}

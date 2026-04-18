import { TriangleAlert, MessageCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WHATSAPP_NUMBER = '+9779864484274';
const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=9779864484274&text=I+want+to+Report+a+Problem.%2C+Please+help+me+to+solve+this.&_fb_noscript=1';

const ReportProblemPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6 md:p-8 space-y-6" style={{ backgroundColor: 'hsl(128.31, 4.59%, 29.67%)' }}>
        <div className="flex items-center justify-center gap-3">
          <TriangleAlert className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl md:text-3xl font-bold">Report a Problem</h1>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          If you are facing problem with the order, please contact our WhatsApp team for support.
        </p>

        <div className="space-y-3">
          <p className="font-medium">
            Please provide these things to our WhatsApp support team to better assist you:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-2">
            <li>Your Order ID</li>
            <li>Detailed Information about your problem</li>
            <li>Screenshot or Screen Recording</li>
          </ol>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            asChild
            size="lg"
            className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
          >
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Support: {WHATSAPP_NUMBER}
            </a>
          </Button>
        </div>
      </Card>

      <Card className="p-5 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <div className="flex gap-3">
          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 leading-relaxed">
            WhatsApp Support is available from <span className="font-bold">9 AM – 9 PM (Nepal Time)</span>. Our team will check your issue and try to solve it.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ReportProblemPage;

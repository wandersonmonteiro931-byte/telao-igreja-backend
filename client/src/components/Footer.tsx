import drewLogo from '@/assets/drew-logo.png';
import equipeLogo from '@/assets/equipe-logo.png';
import { SupportDialog } from '@/components/SupportDialog';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-zinc-900 dark:bg-zinc-950 text-white py-8 mt-auto" data-testid="footer">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 mb-6">
          <div className="flex flex-col items-center">
            <p className="text-xs text-zinc-400 mb-2">Sistema produzido por:</p>
            <img 
              src={drewLogo} 
              alt="Drew Arte Digital" 
              className="h-10 object-contain"
              data-testid="img-drew-logo"
            />
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-xs text-zinc-400 mb-2">Somos uma só equipe!</p>
            <img 
              src={equipeLogo} 
              alt="Equipe da Mídia" 
              className="h-10 object-contain"
              data-testid="img-equipe-logo"
            />
          </div>
        </div>

        <Separator className="bg-zinc-700 my-6" />

        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white">SUGESTÃO:</span>{' '}
            Para transmissão de textos da Bíblia e da Harpa Cristã, sugerimos o sistema{' '}
            <a 
              href="https://holyrics.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
              data-testid="link-holyrics"
            >
              holyrics.com.br
            </a>
          </p>

          <p className="text-xs text-zinc-400 max-w-2xl mx-auto">
            Esse sistema foi desenvolvido exclusivamente para transmissão de imagens e vídeos.
            <br />
            Esse sistema é totalmente gratuito e sua venda ou comercialização é totalmente proibida.
          </p>

          <Separator className="bg-zinc-700 my-4" />

          <div className="flex flex-col items-center gap-2">
            <SupportDialog triggerVariant="button" triggerClassName="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600" />
          </div>

          <Separator className="bg-zinc-700 my-4" />

          <div className="pt-0">
            <p className="text-sm text-zinc-400">
              © Projetor Igreja 2025
            </p>
            <p className="text-xs text-zinc-500">
              Todos os direitos reservados - projetorigreja.shop
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

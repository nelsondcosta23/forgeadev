import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  RedditShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
  RedditIcon,
  TelegramIcon,
} from "react-share";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
}

export const ShareDialog = ({ open, onOpenChange, shareUrl }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);

  const messages = {
    facebook: `🚀 Acabei de criar meu PC dos sonhos com o Forgea! Veja todos os detalhes da minha build personalizada no link: ${shareUrl} 💻✨`,
    twitter: `🔥 Criei meu PC ideal com o Forgea! Confira minha build completa: ${shareUrl} 💻 #PCGaming #TechSetup`,
    whatsapp: `Olá! 👋 Acabei de montar meu PC ideal usando o Forgea! Dá uma olhada na minha configuração completa: ${shareUrl} 🎮💻`,
    linkedin: `🚀 Acabei de criar meu PC dos sonhos com o Forgea! Veja todos os detalhes da minha build personalizada: ${shareUrl} 💻✨`,
    reddit: `Used Forgea to build my dream PC setup! Check out my full custom build here: ${shareUrl} - What do you think? 🖥️`,
    telegram: `🚀 Criei meu PC ideal com o Forgea! Veja a build completa: ${shareUrl} 💻✨`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhe Sua Build
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua configuração personalizada nas redes sociais
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          <FacebookShareButton
            url={shareUrl}
            hashtag="#Forgea"
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
              <FacebookIcon size={40} round />
              <span className="text-sm font-medium">Facebook</span>
            </div>
          </FacebookShareButton>

          <TwitterShareButton
            url={shareUrl}
            title={messages.twitter}
            hashtags={["PCGaming", "TechSetup", "Forgea"]}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
              <TwitterIcon size={40} round />
              <span className="text-sm font-medium">Twitter</span>
            </div>
          </TwitterShareButton>

          <WhatsappShareButton
            url={shareUrl}
            title={messages.whatsapp}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
              <WhatsappIcon size={40} round />
              <span className="text-sm font-medium">WhatsApp</span>
            </div>
          </WhatsappShareButton>

          <LinkedinShareButton
            url={shareUrl}
            title={messages.linkedin}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
              <LinkedinIcon size={40} round />
              <span className="text-sm font-medium">LinkedIn</span>
            </div>
          </LinkedinShareButton>

          <RedditShareButton
            url={shareUrl}
            title={messages.reddit}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
              <RedditIcon size={40} round />
              <span className="text-sm font-medium">Reddit</span>
            </div>
          </RedditShareButton>

          <TelegramShareButton
            url={shareUrl}
            title={messages.telegram}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
              <TelegramIcon size={40} round />
              <span className="text-sm font-medium">Telegram</span>
            </div>
          </TelegramShareButton>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Link Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const messages = {
    facebook: `🚀 ${t('share.facebook', { url: shareUrl, defaultValue: `Just created my dream PC with Forgea! Check out my personalized build: ${shareUrl} 💻✨` })}`,
    twitter: `🔥 ${t('share.twitter', { url: shareUrl, defaultValue: `Built my ideal PC with Forgea! Check my full build: ${shareUrl} 💻 #PCGaming #TechSetup` })}`,
    whatsapp: `${t('share.whatsapp', { url: shareUrl, defaultValue: `Hey! 👋 I just built my ideal PC using Forgea! Check out my full configuration: ${shareUrl} 🎮💻` })}`,
    linkedin: `🚀 ${t('share.linkedin', { url: shareUrl, defaultValue: `Just created my dream PC with Forgea! See all the details of my personalized build: ${shareUrl} 💻✨` })}`,
    reddit: `${t('share.reddit', { url: shareUrl, defaultValue: `Used Forgea to build my dream PC setup! Check out my full custom build here: ${shareUrl} - What do you think? 🖥️` })}`,
    telegram: `🚀 ${t('share.telegram', { url: shareUrl, defaultValue: `Built my ideal PC with Forgea! See the full build: ${shareUrl} 💻✨` })}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('results.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('share.copyError', { defaultValue: 'Error copying link' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('results.shareTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('results.shareDesc')}
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
                {t('results.copied')}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                {t('results.copyLink')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
